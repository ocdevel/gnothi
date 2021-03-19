import asyncio, jwt, pdb, json
from typing import Union, List, Dict, Any
from fastapi import FastAPI
from common.database import with_db
import common.models as M
from app.app_app import app
from common.utils import SECRET, vars
from box import Box
from app.google_analytics import ga
import sqlalchemy as sa
import orjson
import requests
from starlette.websockets import WebSocketDisconnect, WebSocket
from pydantic import BaseModel, parse_obj_as
from common.pydantic.ws import MessageIn, MessageOut, JobStatusOut
from app.utils.errors import GnothiException, NotFound
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


handlers = Box(
    auth=Auth,
    groups=Groups,
    users=Users,
    insights=Insights,
    entries=Entries,
    tags=Tags,
    fields=Fields,
    habitica=Habitica,
    shares=Shares
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
        asyncio.ensure_future(self.connect_user(websocket, token))
        try:
            await self.run_both(websocket)
        except WebSocketDisconnect:
            await self.disconnect(websocket)
        finally:
            await self.disconnect(websocket)

    async def connect_user(self, websocket, token):
        uid = Auth._cognito_to_uid(token)
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

    def get_deps(self, db, uid, message):
        d = Box(mgr=self, uid=uid, db=db, message=message)
        # if checkin:
        #     asyncio.ensure_future(log_checkin(uid, db.session))
        viewer = db.query(M.User).get(uid)
        db.execute(sa.text("update users set updated_at=now() where id=:uid"), dict(uid=uid))
        db.commit()
        as_user, snooping = M.User.snoop(db, viewer, message.as_user)
        d['viewer'] = viewer
        d['user'] = as_user
        d['snooping'] = snooping
        return d

    async def exec_handler(self, fn, data, deps, action=None, uids=None):
        sig = signature(fn)
        model_in = sig.parameters['data'].annotation
        model_out = sig.return_annotation
        data = parse_obj_as(model_in, data)
        out = await fn(data, deps)
        if not out or model_out == Signature.empty:
            return
        out = parse_obj_as(model_out, out)
        action = action or deps.message.action
        uids = uids or [deps.uid]
        pk = getattr(data, 'id', None)
        out = MessageOut(action=action, data=out, id=str(pk))
        await self.send(out, uids=uids)

    async def receive_message_(self, websocket, message):
        with with_db() as db:
            action, data = message.action, message.data
            fn = self.get_handler(action)
            uid = self.ws_to_uid(websocket)
            deps = self.get_deps(db, uid, message)
            await self.exec_handler(fn, data, deps)

    async def receive_message(self, websocket, message):
        message = MessageIn.parse_raw(message)
        try:
            await self.receive_message_(websocket, message)
        except GnothiException as exc:
            out = MessageOut(
                action=message.action,
                error=exc.error,
                detail=exc.detail,
                code=exc.code,
            )
            return await self.send(out, websockets=[websocket])
        except WebSocketDisconnect:
            raise WebSocketDisconnect()
        except Exception as exc:
            out = MessageOut(
                action=message.action,
                error=str(exc),
                detail=str(exc),
                code=500
            )
            await self.send(out, websockets=[websocket])
            # logger.error(exc)
            raise exc

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
        fn = self.get_handler(action)
        await self.exec_handler(fn, data, d, action=action, uids=uids)


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
