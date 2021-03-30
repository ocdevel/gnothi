import asyncio, jwt, pdb, json
from contextlib import contextmanager
from aioify import aioify
from typing import Union, List, Dict, Any
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
from common.pydantic.ws import MessageIn, MessageOut, JobStatusOut
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
    ):
        self.mgr = mgr
        self.message = message
        self.db = db
        self.vid = vid
        self.viewer = viewer
        self.uid = uid
        self.user = user
        self.snooping = snooping


class WSManager(BroadcastHelpers):
    def __init__(self):
        super().__init__()
        self.users: Dict[str, WebSocket] = {}
        asyncio.ensure_future(self.job_status_loop())

    async def job_status_loop(self):
        with with_db() as db:
            while True:
                res = M.Machine.gpu_status(db)
                res = MessageOut(action='jobs/status', data=JobStatusOut(status=res))
                if self.users:
                    await self.send(res, uids=[uid for uid, _ in self.users.items()])
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
        self.users[str(uid)] = websocket
        # await self.send(MessageOut(action='user/ready'), uids=[uid])

    def ws_to_uid(self, websocket):
        itr = iter([k for k, v in self.users.items() if v == websocket])
        return next(itr, None)

    async def disconnect(self, websocket):
        uid = self.ws_to_uid(websocket)
        if uid:
            del self.users[uid]

    def get_handler(self, action):
        split = action.split('/')
        klass, fn = split[0], '_'.join(split[1:])
        print(klass, fn)
        klass = handlers.get(klass, None)
        fn = klass and getattr(klass, f"on_{fn}", None)
        if not fn:
            raise NotFound(action)
        return fn

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

    async def exec(self, fn, data, d: Deps, action=None, uids=None):
        try:
            if type(fn) == str:
                fn = self.get_handler(fn)
            # allow overriding return-route
            action = action or d.message.action

            sig = signature(fn)
            model_in = sig.parameters['data'].annotation
            model_out = sig.return_annotation
            data = parse_obj_as(model_in, data)
            out = await fn(data, d)
            if out is None or model_out == Signature.empty:
                return
            out = parse_obj_as(model_out, out)
            uids = uids or [d.vid]
            pk = getattr(data, 'id', None)
            out = MessageOut(action=action, data=out, id=str(pk))
            await self.send(out, uids=uids)
        except (GnothiException) as exc:
            return await self.send_error(self.users[d.vid], action, exc)

    async def send_error(self, websocket, action, exc):
        out = MessageOut(
            action=action,
            error=getattr(exc, 'error', str(exc)),
            detail=getattr(exc, 'detail', str(exc)),
            code=getattr(exc, 'code', 500),
        )
        logger.error(action)
        logger.error(exc)
        return await self.send(out, websockets=[websocket])

    async def receive_message(self, websocket, message):
        try:
            message = MessageIn.parse_raw(message)
            with self.with_deps(websocket, message) as d:
                await self.exec(message.action, message.data, d)
                # await aioify(obj=self.checkin)(message, d)
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
            websockets = [
                self.users[str(uid)]
                for uid in uids
                if str(uid) in self.users]
        if not websockets: return
        await asyncio.wait([
            ws.send_text(obj.json())
            for ws in websockets
        ])

    async def send_other(self, action, data, d, uids=None):
        await self.exec(action, data, d, action=action, uids=uids)


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
