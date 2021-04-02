import asyncio, jwt, pdb, json, traceback
from contextlib import contextmanager
from aioify import aioify
from typing import Union, List, Dict, Any, Callable
from fastapi import FastAPI
from common.database import with_db
import common.models as M
from app.app_app import app
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


from app.routes.auth import Auth, decode_jwt
from app.routes.users import Users
from app.routes.groups import Groups
from app.routes.insights import Insights
from app.routes.entries import Entries
from app.routes.tags import Tags
from app.routes.fields import Fields
from app.routes.habitica import Habitica
from app.routes.shares import Shares
from app.routes.notifs import Notifs


handlers = Box(
    auth=Auth,
    groups=Groups,
    users=Users,
    insights=Insights,
    entries=Entries,
    tags=Tags,
    fields=Fields,
    habitica=Habitica,
    shares=Shares,
    notifs=Notifs
)


class BroadcastHelpers:
    def __init__(self):
        self.broadcast = Broadcast(vars.DB_FULL)

    async def _startup(self):
        await self.broadcast.connect()
        asyncio.ensure_future(self._ws_jobs())

    async def _shutdown(self):
        await self.broadcast.disconnect()

    async def _ws_receiver(self, websocket):
        async for message in websocket.iter_text():
            await self.broadcast.publish(channel="app", message=message)

    async def _ws_sender(self, websocket):
        async with self.broadcast.subscribe(channel="app") as subscriber:
            async for event in subscriber:
                await self.receive_message(websocket, event.message)
                
    async def _ws_jobs(self):
        async with self.broadcast.subscribe(channel="jobs") as subscriber:
            async for event in subscriber:
                await Insights._job_done(self, event.message)

    async def run_both(self, websocket):
        await run_until_first_complete(
            (self._ws_receiver, {"websocket": websocket}),
            (self._ws_sender, {"websocket": websocket}),
        )


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
    def __init__(self):
        super().__init__()
        self.users: List[(str, WebSocket)] = []
        asyncio.ensure_future(self.job_status_loop())

    async def job_status_loop(self):
        with with_db() as db:
            while True:
                res = M.Machine.gpu_status(db)
                res = MessageOut(action='jobs/status', data=JobStatusOut(status=res))
                if self.users:
                    await self.send(res, uids=[uid for uid, _ in self.users])
                await asyncio.sleep(2)

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
            return await self.send_error(self.uid_to_ws(d.vid), action, exc)
        except Exception as exc:
            traceback.print_exc()
            raise exc

    async def send_error(self, websocket, action, exc):
        out = MessageOut(
            action=action,
            error=getattr(exc, 'error', str(exc)),
            detail=getattr(exc, 'detail', str(exc)),
            code=getattr(exc, 'code', 500),
        )
        return await self.send(out, websockets=[websocket])

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
            await self.send_error(websocket, message.action, exc)

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


def jwt_auth(args):
    # TODO more robust authentication here
    # if 'QUERY_STRING' in data[1]:
    #     environ = data[1]
    #     token = dict(parse_qsl(environ['QUERY_STRING']))['token']
    # else:
    #     token = data[1]['jwt']
    token = args[1]['jwt']
    try:
        decoded = jwt.decode(token, SECRET)
        return decoded['sub']
    except:
        return None


# if auth or viewer or checkin:
#     uid = jwt_auth(args)
#     if not uid:
#         return JWT_EXPIRED

# @sio.on("disconnect")
# async def on_disconnect(sid):
#     try:
#         sess = await sio.get_session(sid)
#         await sio.emit("client/groups/online", {sess['uid']: False})
#         print(sid, 'disconnected')
#     except:
#         pass
