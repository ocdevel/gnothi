import pdb, re, datetime, logging, boto3, io
from pprint import pprint
from app.app_app import app
from app.app_jwt import jwt_user
import common.models as M
from fastapi_sqlalchemy import db
from app.socket_manager import SocketManager

import logging, time, asyncio
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, Depends, APIRouter
from pydantic import BaseModel
from starlette.requests import Request
from starlette.types import ASGIApp, Receive, Scope, Send
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

import socketio

logger = logging.getLogger(__name__)
getuser = M.User.snoop
router = InferringRouter()
mgr = SocketManager(app=app, cors_allowed_origins=[])
redis = mgr._mgr
sio = mgr._sio


class GroupsNamespace(socketio.AsyncNamespace):
    def __init__(self, *args, **kwargs):
        self._clients = {}
        super().__init__(*args, **kwargs)

    async def on_connect(self, sid, environ):
        self._clients[sid] = True
        logger.info(self._clients)
        await sio.emit(f"{sid} connected")

    def on_disconnect(self, sid):
        self._clients.pop(sid)
        print(sid, 'disconnected')

    async def on_message(self, sid, data):
        await self.emit('message', data)

    async def on_room(self, sid, gid):
        # old = await self.get_session(sid, '/groups')
        # if old:
        #     self.leave_room(old['gid'],  '/groups')
        # pprint(dict(sid=sid, old=old, gid=gid))
        # await self.save_session(sid, {"gid": gid}, "/groups")
        self.enter_room(sid, gid)
        users = redis.get_participants('/groups', gid)
        users = [u[0] for u in users]
        print(users)
        await self.emit("users", users)


sio.register_namespace(GroupsNamespace('/groups'))


# @sio.on('connect')
# async def connect(sid, environ):
#     print(sio._sio.get_session("test"))
#     await sio._sio.save_session("test", {"test": 1})
#
# @sio.on('disconnect')
# def on_disconnect(sid):
#     logger.info('disconnect')
#     pass
#
# async def on_my_event(self, sid, data):
#     await self.emit('my_response', data)


class RoomEventMiddleware:  # pylint: disable=too-few-public-methods
    """Middleware for providing a global :class:`~.Room` instance to both HTTP
    and WebSocket scopes.
    Although it might seem odd to load the broadcast interface like this (as
    opposed to, e.g. providing a global) this both mimics the pattern
    established by starlette's existing DatabaseMiddlware, and describes a
    pattern for installing an arbitrary broadcast backend (Redis PUB-SUB,
    Postgres LISTEN/NOTIFY, etc) and providing it at the level of an individual
    request.
    """

    def __init__(self, app: ASGIApp):
        self._app = app
        # self._room = Room()
        self._clients = {}
        asyncio.ensure_future(self.loop())

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        await self._app(scope, receive, send)

    async def loop(self):
        with db():
            while True:
                res = M.Machine.gpu_status(db.session)
                await sio.emit("AI_STATUS", {"status": res})
                await asyncio.sleep(2)


@cbv(router)
class Groups:
    as_user: str = None
    viewer: M.User = Depends(jwt_user)

    @router.post("/groups")
    def groups_post(self, data: M.SIGroup):
        db.session.add(M.Group(
            title=data.title,
            text=data.text,
            privacy=data.privacy,
            owner=self.viewer.id,
        ))
        db.session.commit()
        return {"ok": True}

    @router.get("/groups")
    def groups_get(self) -> List[M.SOGroup]:
        # user, snooping = getuser(viewer, as_user)
        # if snooping and not user.share_data.profile:
        #     return cant_snoop()
        # TODO only show public/paid, unless they're a member
        return db.session.query(M.Group).all()

    # @router.put("/item/{item_id}")
    # def update_item(self, item_id: ItemID, item: ItemCreate) -> ItemInDB:

    # @router.delete("/item/{item_id}")
    # def delete_item(self, item_id: ItemID) -> APIMessage:


@cbv(router)
class Group:
    as_user: str = None
    viewer: M.User = Depends(jwt_user)

    @router.get("/groups/{gid}")
    def group_get(self, gid: str) -> M.SOGroup:
        return db.session.query(M.Group).get(gid)

    async def send_message(self, msg, db):
        msg = M.Message(**msg)
        db.session.add(msg)
        db.session.commit()
        gid = str(msg.group_id)
        msg = dict(
            message=msg.text,
            id=str(msg.owner_id) if msg.owner_id else None,
        )
        print(gid, msg)
        await sio.emit("message", msg, room=gid, namespace="/groups")

    @router.get("/groups/{gid}/messages")
    def messages_get(self, gid: str):
        res = db.session.query(M.Message)\
            .filter(M.Message.group_id == gid)\
            .order_by(M.Message.created_at.asc())\
            .all()
        return [dict(
            id=str(m.user_id),
            message=m.text,
        ) for m in res]

    @router.post("/groups/{gid}/messages")
    async def messages_post(self, gid: str, data: M.SIMessage):
        msg = dict(
            text=data.message,
            group_id=gid,
            owner_id=self.viewer.id,
            recipient_type=M.MatchTypes.groups,
        )
        await self.send_message(msg, db)

    @router.post("/groups/{gid}/join")
    async def join_post(self, gid: str):
        UG = M.UserGroup
        if db.session.query(UG)\
            .filter(UG.user_id==self.viewer.id, UG.group_id==gid)\
            .first():
            return {}
        ug = UG(
            user_id=self.viewer.id,
            group_id=gid,
            role='member'
        )
        db.session.add(ug)
        db.session.commit()
        msg = dict(
            group_id=gid,
            recipient_type=M.MatchTypes.groups,
            text=f"{ug.username} just joined!"
        )
        await self.send_message(msg, db)

app.include_router(router)
app.add_middleware(RoomEventMiddleware)
