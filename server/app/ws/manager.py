import asyncio, jwt, pdb, json, traceback
from contextlib import contextmanager
from aioify import aioify
from typing import Union, List, Dict, Any, Callable
from fastapi import FastAPI
from common.database import with_db
import common.models as M
from common.utils import SECRET, vars
from box import Box
from app.analytics import ga
import sqlalchemy as sa
import sqlalchemy.orm as orm
from starlette.websockets import WebSocketDisconnect, WebSocket
from pydantic import BaseModel, parse_obj_as
from common.pydantic.ws import MessageIn, MessageOut, JobStatusOut, ResWrap
from common.errors import GnothiException, NotFound, InvalidJwt
import logging
from starlette.concurrency import run_until_first_complete
from broadcaster import Broadcast

logger = logging.getLogger(__name__)

from inspect import signature, Signature

from . import handlers, Auth, Insights
from app.ws.auth import decode_jwt

class Deps:
    def __init__(
        self,
        mgr: Any,  # WSManager, not defined yet
        message: Any,
        db: orm.Session,

        vid: str,
        viewer: M.User,
        uid: str,
        user: M.User,
        snooping: bool = False,
        everyone: bool = False
    ):
        self.mgr = mgr
        self.message = message
        self.db = db
        self.vid = vid
        self.viewer = viewer
        self.uid = uid
        self.user = user
        self.snooping = snooping

    def clone(self, everyone=False):
        return Deps(self.mgr, self.message, self.db, self.viewer, self.uid,
                    self.user, self.snooping, everyone=everyone)


class WSManager(BroadcastHelpers):

    async def init_socket(self, websocket, token):
        await websocket.accept()  # FastAPI
        try:
            await self.connect_user(websocket, token)
            await self.run_both(websocket)
        except InvalidJwt as exc:
            await self.send(MessageOut(
                action='connect/error',
                error=exc.error, detail=exc.detail, code=exc.code
            ), websockets=[websocket])
        except WebSocketDisconnect:
            await self.disconnect(websocket)
        finally:
            await self.disconnect(websocket)

    async def connect_user(self, websocket, token):
        uid = Auth._cognito_to_uid(token)
        if not uid:
            raise InvalidJwt()
        self.users.append((str(uid), websocket))
        # await self.send(MessageOut(action='user/ready'), uids=[uid])

    def uids(self):
        return [uid for uid, _ in self.users]

    async def disconnect(self, websocket):
        for tup in self.users:
            if tup[1] != websocket: continue
            self.users.remove(tup)

    def get_handler(self, action):
        split = action.split('/')
        klass, fn = split[0], '_'.join(split[1:])
        # print(klass, fn)
        klass = handlers.get(klass, None)
        fn = klass and getattr(klass, f"on_{fn}", None)
        if not fn:
            raise NotFound(action)
        return fn

    def ws_to_uid(self, websocket):
        return next(iter([uid for uid, ws in self.users if ws == websocket]), None)

    def uid_to_ws(self, uid):
        return next(iter([ws for uid, ws in self.users if uid == uid]), None)

    @contextmanager
    def with_deps(self, websocket, message):
        vid = self.ws_to_uid(websocket)
        with with_db() as db:
            viewer = db.query(M.User).get(vid)
            as_user, snooping = M.User.snoop(db, viewer, message.as_user)
            yield Deps(
                mgr=self, message=message, db=db,
                vid=str(vid), viewer=viewer, uid=str(as_user.id), user=as_user, snooping=snooping
            )

    def checkin(self, data, d: Deps):
        d.db.execute(sa.text("update users set updated_at=now() where id=:id"), dict(id=d.vid))
        d.db.commit()
        ga(data, d)

    async def exec(
        self,
        d: Deps,
        action: str = None,
        fn: Callable = None,
        input: Any = {},
        output: Any = None,  # allow passing in response and skipping call
        model: BaseModel = None,  # allow sending output directly
        uids: Union[bool, List[str]] = None  # True means the function will return uuids. None means [d.vid]
    ):
        action = action or d.message.action
        try:
            if (fn is None) and (model is None):
                fn = self.get_handler(action)
            if model is None:
                sig = signature(fn)
                model = sig.return_annotation
            if output is None:
                model_in = sig.parameters['data'].annotation
                input = parse_obj_as(model_in, input)
                args, kwargs = [input, d], {}
                if sig.parameters.get('uids', None):
                    kwargs['uids'] = uids
                output = await fn(*args, **kwargs)
            if output is None or model == Signature.empty:
                return
            msg_args = {}
            uids = None
            if type(output) == ResWrap:
                msg_args = output.dict()
                output = msg_args.pop('data')
                uids = msg_args.pop('uids')
            uids = uids or [d.vid]
            output = parse_obj_as(model, output)
            output = MessageOut(action=action, data=output, **msg_args)
            await self.send(output, uids=uids)
        except GnothiException as exc:
            return await self.send_error(action, exc, uid=d.vid)
        except Exception as exc:
            traceback.print_exc()
            raise exc

    async def send_error(self, action, exc, uid=None, websocket=None):
        out = MessageOut(
            action=action,
            error=getattr(exc, 'error', str(exc)),
            detail=getattr(exc, 'detail', str(exc)),
            code=getattr(exc, 'code', 500),
        )
        args = dict(uids=[uid]) if uid else dict(websockets=[websocket])
        return await self.send(out, **args)

    async def receive_message(self, websocket, message):
        try:
            message = MessageIn.parse_raw(message)
            try: decode_jwt(message.jwt)
            except:
                # TODO how do I properly disconnect? Trying both below
                websocket.close()
                raise WebSocketDisconnect()
            with self.with_deps(websocket, message) as d:
                await self.exec(d, action=message.action, input=message.data)
                await aioify(obj=self.checkin)(message, d)
        except WebSocketDisconnect:
            raise WebSocketDisconnect()
        except (GnothiException, Exception) as exc:
            await self.send_error(message.action, exc, websocket=websocket)

    async def send(
        self,
        obj: BaseModel,
        uids: List[str] = None,
        websockets: List[WebSocket] = None
    ):
        if uids:
            uids = [str(uid) for uid in uids]
            websockets = [
                ws for uid, ws in self.users
                if uid in uids
            ]
        if not websockets: return
        await asyncio.wait([
            ws.send_text(obj.json())
            for ws in websockets
        ])

