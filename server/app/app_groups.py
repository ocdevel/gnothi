import pdb, re, datetime, logging, boto3, io
from pprint import pprint
from app.app_app import app
from app.app_jwt import jwt_user
import common.models as M
from fastapi_sqlalchemy import db
from app.socket_manager import SocketManager
from urllib.parse import urlsplit, parse_qsl
from fastapi_jwt_auth import AuthJWT

import logging, time, asyncio
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, Depends, APIRouter
from pydantic import BaseModel
from starlette.requests import Request
from starlette.types import ASGIApp, Receive, Scope, Send
import jwt
from common.utils import SECRET
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

import socketio

logger = logging.getLogger(__name__)
getuser = M.User.snoop
router = InferringRouter()
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


class GroupsNamespace(socketio.AsyncNamespace):
    async def on_connect(self, sid, environ):
        token = dict(parse_qsl(environ['QUERY_STRING']))['token']
        decoded = jwt.decode(token, SECRET)
        uid = decoded['sub']
        await self.save_session(sid, {'uid': uid})

    async def on_disconnect(self, sid):
        try:
            sess = await self.get_session(sid, '/groups')
            await self.emit("online", {sess['uid']: False})
            print(sid, 'disconnected')
        except:
            pass

    async def on_message(self, sid, data):
        await self.emit('message', data)

    async def on_room(self, sid, gid):
        self.enter_room(sid, gid)
        await self.refresh_online(gid)
        await self.on_get_members(sid, gid)

    async def on_get_members(self, sid, gid):
        with db():
            members = M.UserGroup.get_members(db.session, gid)
            await self.emit("members", members, room=gid)

    async def refresh_online(self, gid):
        sids = redis.get_participants('/groups', gid)
        uids = {}
        for s in next(sids):
            try:
                sess = await self.get_session(s)
                uids[sess['uid']] = True
            except: continue
        await self.emit("online", uids, room=gid)

    async def on_change_privacy(self, sid, data):
        with db():
            sess = await self.get_session(sid, '/groups')
            uid, gid = sess['uid'], data['gid']
            ug = db.session.query(M.UserGroup)\
                    .filter_by(user_id=uid, group_id=gid).first()
            setattr(ug, data['key'], data['value'])
            db.session.commit()
            await self.on_get_members(sid, gid)


sio.register_namespace(GroupsNamespace('/groups'))


@cbv(router)
class Groups:
    as_user: str = None
    viewer: M.User = Depends(jwt_user)

    @router.post("/groups")
    def groups_post(self, data: M.SIGroup):
        M.Group.create_group(db.session, data.title, data.text,
                             self.viewer.id, data.privacy)
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
        return M.Group.group_with_membership(db.session, gid, self.viewer.id)

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
            id=str(m.owner_id),
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
        uid = str(self.viewer.id)
        ug = M.Group.join_group(db.session, gid, uid)
        if not ug: return {}
        msg = dict(
            group_id=gid,
            recipient_type=M.MatchTypes.groups,
            text=f"{ug.username} just joined!"
        )
        await self.send_message(msg, db)
        await sio.emit("new_member", gid, room=gid, namespace="/groups")

    @router.post("/groups/{gid}/leave")
    async def leave_post(self, gid: str):
        uid = str(self.viewer.id)
        ug = M.Group.leave_group(db.session, gid, uid)
        msg = dict(
            group_id=gid,
            recipient_type=M.MatchTypes.groups,
            text=f"{ug['username']} just left :("
        )
        await sio.emit("new_member", gid, room=gid, namespace="/groups")
        await self.send_message(msg, db)

app.include_router(router)
