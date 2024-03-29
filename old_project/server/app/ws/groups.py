import pdb, logging, asyncio
import common.pydantic.groups as PyG
import common.models as M
from typing import List, Dict, Any, Optional
from pydantic import parse_obj_as, UUID4
from common.errors import AccessDenied, CantSnoop, NotFound
from common.pydantic.utils import BM_ID, BM, Valid
from common.pydantic.ws import ResWrap
import sqlalchemy as sa
import common.pydantic.entries as PyE
from app.ws.notifs import Notifs

logger = logging.getLogger(__name__)


class Groups:
    @staticmethod
    async def send_message(msg, d):
        gid = msg.obj_id
        msg_uids = M.UserGroup.get_uids(d.db, gid)
        notifs = M.GroupNotif.create_notifs(d.db, gid)
        await asyncio.wait([
            d.mgr.exec(d, output=msg, model=PyG.MessageOut, action='groups/message/get', uids=msg_uids),
            Notifs._send_notifs(d, 'notifs/groups/get', notifs)

        ])

    @staticmethod
    async def on_messages_post(data: PyG.MessageIn, d):
        msg = M.GroupMessage.create_message(d.db, data.id, data.text, d.vid)
        await Groups.send_message(msg, d)

    @staticmethod
    async def on_group_join(data: BM_ID, d):
        ug = M.Group.join_group(d.db, data.id, d.vid)
        if not ug:
            return
        text = f"{ug.username} just joined!"
        msg = M.GroupMessage.create_message(d.db, data.id, text)
        await asyncio.wait([
            Groups.send_message(msg, d),
            d.mgr.exec(d, action='groups/members/get', input=data, uids=True),
        ])

    @staticmethod
    async def on_group_leave(data: BM_ID, d) -> Dict:
        vid, gid = str(d.vid), data.id
        ug = M.Group.leave_group(d.db, data.id, vid)
        msg = M.GroupMessage.create_message(d.db, data.id, f"{ug['username']} just left :(")
        await asyncio.wait([
            d.mgr.exec(d, action='groups/members/get', input=data, uids=True),
            Groups.send_message(msg, d),
            d.mgr.exec(d, action='groups/mine/get')
        ])
        return {'ok': True}

    @staticmethod
    async def on_messages_get(data: BM_ID, d) -> List[PyG.MessageOut]:
        return M.GroupMessage.get_messages(d.db, data.id, d.vid)

    @staticmethod
    async def on_group_enter(data: BM_ID, d):
        await asyncio.wait([
            d.mgr.exec(d, action='notifs/groups/seen', input=data),
            d.mgr.exec(d, action='groups/group/get', input=data),
            d.mgr.exec(d, action='groups/messages/get', input=data),
            d.mgr.exec(d, action='groups/entries/get', input=data),
            d.mgr.exec(d, action='groups/members/get', input=data, uids=True),
        ])

    @staticmethod
    async def on_group_get(data: BM_ID, d, uids=None) -> PyG.GroupOut:
        M.UserGroup.check_access(d.db, data.id, d.vid)
        g = d.db.query(M.Group).get(data.id)
        if uids is True:
            uids = M.UserGroup.get_uids(d.db, data.id)
        return ResWrap(data=g, uids=uids)

    @staticmethod
    async def on_groups_get(data: BM, d, uids=None) -> List[PyG.GroupOut]:
        res = M.Group.get_groups(d.db)
        if uids is True:
            uids = d.mgr.uids()
        return ResWrap(data=res, keyby='id', uids=uids)

    @staticmethod
    async def on_members_get(data: BM_ID, d, uids=None) -> List[PyG.MembersOut]:
        res = M.UserGroup.get_members(d.db, data.id)
        uids_ = []
        for r in res:
            uid = str(r['user'].id)
            uids_.append(uid)
            r['user_group'].online = uid in d.mgr.uids()
        uids_ = dict(uids=uids_) if uids is True else {}
        return ResWrap(data=res, keyby='user.id', **uids_)

    @staticmethod
    async def on_groups_post(data: PyG.GroupPost, d) -> PyG.GroupOut:
        g = M.Group.create_group(d.db, data, d.vid)
        await asyncio.wait([
            d.mgr.exec(d, action='groups/groups/get', uids=True),
            d.mgr.exec(d, action='groups/mine/get'),
        ])
        return g

    @staticmethod
    async def on_group_put(data: PyG.GroupPut, d) -> Dict:
        db, mgr = d.db, d.mgr
        g = db.query(M.Group).filter_by(owner_id=d.vid, id=data.id).first()
        if not g: raise NotFound()
        for k, v in data.dict().items():
            setattr(g, k, v)
        db.commit()
        await mgr.exec(d, action='groups/group/get', input=dict(id=data.id), uids=True)
        return dict(valid=True)

    @staticmethod
    async def on_mine_get(data: BM, d) -> List[PyG.GroupOut]:
        g = M.Group.my_groups(d.db, d.vid)
        return ResWrap(data=g, keyby='id')

    @staticmethod
    async def on_entries_get(data: BM_ID, d, uids=None) -> List[PyE.EntryGet]:
        # TODO handle uids=[], need to not use d.vid
        res = M.Entry.snoop(d.db, d.vid, d.vid, group_id=data.id).all()
        return ResWrap(data=res, keyby='id', uids=[d.vid])

    @staticmethod
    async def on_member_invite(data: PyG.GroupInvitePost, d) -> Valid:
        res = M.UserGroup.invite_member(d.db, data.id, d.vid, data.email)
        await d.mgr.exec(d, action='groups/members/get', input=data, uids=True)
        return res

    @staticmethod
    async def on_member_modify(data: PyG.MemberModifyPost, d) -> Valid:
        db = d.db
        if str(data.user_id) == str(d.vid):
            return dict(valid=False)
        M.UserGroup.check_access(db, data.id, d.vid, [M.GroupRoles.owner, M.GroupRoles.admin])
        q = db.query(M.UserGroup).filter_by(user_id=data.user_id, group_id=data.id)
        if data.remove:
            q.delete()
        elif data.role:
            ug = q.first()
            ug.role = data.role
        db.commit()
        await d.mgr.exec(d, action='groups/members/get', input=data, uids=True)
        return dict(valid=True)


groups_router = None
