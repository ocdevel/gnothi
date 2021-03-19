import pdb, logging, asyncio
import common.pydantic.groups as PyG
import common.models as M
from typing import List, Dict, Any, Optional
from pydantic import parse_obj_as, UUID4
from app.utils.errors import CantInteract, CantSnoop
from common.pydantic.utils import BM_ID, BM
from common.pydantic.ws import MessageOut

logger = logging.getLogger(__name__)


class Groups:
    @staticmethod
    def _wrap(obj, py_model, gid, action=None):
        out = parse_obj_as(py_model, obj)
        if action:
            out = MessageOut(action=action, data=out, id=str(gid))
        return out


    @staticmethod
    async def _send_message(msg, d):
        db, mgr = d.db, d.mgr
        gid = msg['group_id']
        uids = M.UserGroup.get_uids(db, msg['group_id'])
        msg = M.Message(**msg)
        db.add(msg)
        db.commit()

        msg = Groups._wrap(msg, PyG.MessageOut, gid, action='groups/message/get')
        await mgr.send(msg, uids=uids)

    @staticmethod
    async def _send_members(gid, d, to_all=True):
        members = M.UserGroup.get_members(d.db, gid)
        for uid, m in members.items():
            m['online'] = uid in d.mgr.users

        out = Groups._wrap(members, PyG.MembersOut, gid, action='groups/members/get')
        uids = [uid for uid, _ in members.items()] \
            if to_all else [d.uid]
        await d.mgr.send(out, uids=uids)

    @staticmethod
    async def on_messages_post(data: PyG.MessageIn, d):
        if d.snooping: raise CantSnoop()
        if not M.UserGroup.get_role(d.db, d.uid, data.id):
            raise CantInteract()
        msg = dict(
            text=data.text,
            group_id=data.id,
            owner_id=d.uid,
            recipient_type=M.MatchTypes.groups,
        )
        await Groups._send_message(msg, d)

    @staticmethod
    async def on_group_join(data: BM_ID, d):
        ug = M.Group.join_group(d.db, data.id, d.uid)
        if not ug:
            return
        msg = dict(
            group_id=data.id,
            recipient_type=M.MatchTypes.groups,
            text=f"{ug.username} just joined!"
        )
        await asyncio.wait([
            Groups._send_message(msg, d),
            Groups._send_members(data.id, d)
        ])

    @staticmethod
    async def group_leave(data: BM_ID, d) -> Dict:
        uid, gid = str(d.uid), data.id
        ug = M.Group.leave_group(d.db, data.id, uid)
        msg = dict(
            group_id=gid,
            recipient_type=M.MatchTypes.groups,
            text=f"{ug['username']} just left :("
        )
        await asyncio.wait([
            Groups._send_members(gid, d),
            Groups._send_message(msg, d),
        ])
        return {'ok': True}

    @staticmethod
    async def on_messages_get(data: BM_ID, d) -> List[PyG.MessageOut]:
        # TODO check perms
        return d.db.query(M.Message) \
            .filter(M.Message.group_id == data.id) \
            .order_by(M.Message.created_at.asc()) \
            .all()

    @staticmethod
    async def on_group_enter(data: BM_ID, d):
        await asyncio.wait([
            d.mgr.send_other('groups/group/get', data, d),
            d.mgr.send_other('groups/messages/get', data, d),
            d.mgr.send_other('groups/members/get', data, d)
        ])

    @staticmethod
    async def on_group_get(data: BM_ID, d) -> PyG.GroupOut:
        # TODO check perms
        return d.db.query(M.Group).get(data.id)

    @staticmethod
    async def on_groups_get(data: BM, d) -> List[PyG.GroupOut]:
        return d.db.query(M.Group).all()

    @staticmethod
    async def on_members_get(data: BM_ID, d):
        await Groups._send_members(data.id, d, to_all=False)

    @staticmethod
    async def on_privacy_put(data: PyG.PrivacyIn, d):
        ug = d.db.query(M.UserGroup)\
                .filter_by(user_id=d.uid, group_id=data.id).first()
        setattr(ug, data.key, data.value)
        d.db.commit()
        await Groups._send_members(data.id, d)

    @staticmethod
    async def on_groups_post(data: PyG.GroupIn, d) -> PyG.GroupOut:
        g = M.Group.create_group(d.db, data.title, data.text, d.uid, data.privacy)
        uids = [uid for uid, _ in d.mgr.users.items()]
        await d.mgr.send_other('groups/groups/get', data, d, uids=uids)
        return g


groups_router = None
