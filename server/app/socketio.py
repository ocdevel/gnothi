import asyncio, socketio, jwt, pdb
from typing import Union
from fastapi import FastAPI
from fastapi_sqlalchemy import db
import common.models as M
from app.app_app import app
from common.utils import SECRET
from box import Box
from app.google_analytics import ga
import sqlalchemy as sa
import orjson
from typing import List


class SocketError(Exception):
    def __init__(self, code, title, message):
        self.code = code
        self.title = title
        self.message = message
        super().__init__(message)


class CantSnoop(SocketError):
    def __init__(self, message=None):
        message = message or "Can't access this user's feature"
        super().__init__(401, "CANT_SNOOP", message)


# TODO handle other JWT errors
JWT_EXPIRED = dict(code=401, error=dict(title="JWT_EXPIRED", message="JWT Expired"))


def to_io(data, model=None, multi=False):
    """
    FastAPI routes will convert responses to json properly via response_model,
    but I can't get it working manually with Pydantic (for Socket.IO). Help function
    that uses orjson to convert things like datetime.datetime properly, then back to dict
    """
    if model:
        def to_io_(obj):
            return model.from_orm(obj).dict()
        data = [to_io_(x) for x in data]\
            if multi else to_io_(data)
    data = orjson.dumps(data)
    return orjson.loads(data)


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


async def log_checkin(uid, sess):
    ga(uid, 'user', 'checkin')
    sql = sa.text(f"update users set updated_at=now() where id=:uid")
    sess.execute(sql, {'uid': uid})
    sess.commit()
    return {}


def on_(event, auth=True, viewer=True, sess=True, checkin=True, model_in=None, model_out=None):
    def wrap(f):
        @sio.on(event)
        async def orig(*args, **kwargs):
            uid, viewer_, snooping_ = None, None, None
            if auth or viewer or checkin:
                uid = jwt_auth(args)
                if not uid:
                    return JWT_EXPIRED
            with db():
                body = args[1]
                deps_ = Box(uid=uid, sess=db.session)
                if checkin:
                    asyncio.ensure_future(log_checkin(uid, db.session))
                if viewer:
                    viewer_ = db.session.query(M.User).get(uid)
                    as_user, snooping = M.User.snoop(viewer_, body.get('as_user', None))
                    deps_['viewer'] = viewer_
                    deps_['user'] = as_user
                    deps_['snooping'] = snooping_
                # return await f(*args, **kwargs, d=deps_)
                try:
                    body_ = body.get('data', {})
                    if model_in:
                        body_ = model_in(**body_)
                    res = await f(args[0], body_, deps_)
                except SocketError as err:
                    print(err)
                    return dict(code=err.code, error=err.__dict__)
                except Exception as err:
                    print(err)
                    return dict(code=500, error=dict(title="SERVER_ERROR", message=str(err)))
                # if res and model_out:
                #     res = to_io(res, model_out)
                return dict(code=200, data=res or {})
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


@on_("server/auth/jwt", auth=True, viewer=False, sess=False, checkin=False)
async def on_jwt(sid, data, d):
    await sio.save_session(sid, {'uid': d.uid})
