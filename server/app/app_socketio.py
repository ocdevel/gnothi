import asyncio, socketio, jwt
from typing import Union
from fastapi import FastAPI
from fastapi_sqlalchemy import db
import common.models as M
from app.app_app import app
from common.utils import SECRET
from box import Box


# Adapted from fastapi-socketio. That lib doesn't do much, below is all that's
# necessary (and I added Redis support)
class SocketManager:
    def __init__(
        self,
        app: FastAPI,
        mount_location: str = "/ws",
        socketio_path: str = "socket.io",
        cors_allowed_origins: Union[str, list] = '*',
    ) -> None:
        # TODO: Change Cors policy based on fastapi cors Middleware
        # self._sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=cors_allowed_origins)
        self._mgr = socketio.AsyncRedisManager('redis://192.168.0.2:6379')
        self._sio = socketio.AsyncServer(client_manager=self._mgr, async_mode="asgi", cors_allowed_origins=cors_allowed_origins)
        self._app = socketio.ASGIApp(
            socketio_server=self._sio, socketio_path=socketio_path
        )

        app.mount(mount_location, self._app)
        app.sio = self._sio

    def is_asyncio_based(self) -> bool:
        return True


mgr = SocketManager(app=app, cors_allowed_origins=[])
redis = mgr._mgr
sio = mgr._sio


async def job_status_loop():
    with db():
        while True:
            res = M.Machine.gpu_status(db.session)
            await sio.emit("AI_STATUS", {"status": res})
            await asyncio.sleep(2)

sio.start_background_task(job_status_loop)


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


def on_(event, auth=False, viewer=False, snooping=False, sess=False):
    def wrap(f):
        @sio.on(event)
        async def orig(*args, **kwargs):
            uid, viewer_, snooping_ = None, None, None
            if auth or viewer or snooping:
                uid = jwt_auth(args)
                if not uid:
                    return {"error": "jwt_expired"}
            with db():
                if snooping:
                    pass
                elif viewer:
                    viewer_ = db.session.query(M.User).get(uid)
                deps_ = Box(uid=uid, viewer=viewer_, snooping=snooping_, sess=db.session)
                # return await f(*args, **kwargs, d=deps_)
                res = await f(args[0], args[1]['data'], d=deps_)
                return res or {}
        return orig
    return wrap


@sio.on("connect")
async def on_connect(sid, environ):
    print(sid, 'connected')
    # await sio.save_session(sid, {'uid': d.uid})


@sio.on("disconnect")
async def on_disconnect(sid):
    try:
        sess = await sio.get_session(sid)
        await sio.emit("client/groups/online", {sess['uid']: False})
        print(sid, 'disconnected')
    except:
        pass


@on_("server/auth/jwt", auth=True)
async def on_jwt(sid, data, d=None):
    await sio.save_session(sid, {'uid': d.uid})
