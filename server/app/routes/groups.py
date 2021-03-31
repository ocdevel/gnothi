import pdb, logging, asyncio
import common.pydantic.groups as PyG
import common.models as M
from typing import List, Dict, Any, Optional
from pydantic import parse_obj_as, UUID4
from common.errors import AccessDenied, CantSnoop
from common.pydantic.utils import BM_ID, BM
from common.pydantic.ws import MessageOut
import sqlalchemy as sa
import common.pydantic.entries as PyE

logger = logging.getLogger(__name__)


class Groups:
    @staticmethod
    async def send_message(msg, d):
        gid = msg.obj_id
        uids = M.UserGroup.get_uids(d.db, gid)
        await d.mgr.exec(d, output=msg, model=PyG.MessageOut, action='groups/message/get', uids=uids)
        uids = M.GroupNotif.create_notifs(d.db, gid)
        await d.mgr.exec(d, output=dict(id=gid), model=Dict, action='notifs/group', uids=uids)

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
            d.mgr.exec(d, action='groups/group/get', input=data),
            d.mgr.exec(d, action='groups/messages/get', input=data),
            d.mgr.exec(d, action='groups/entries/get', input=data),
            d.mgr.exec(d, action='groups/members/get', input=data, uids=True),
        ])

    @staticmethod
    async def on_group_get(data: BM_ID, d) -> PyG.GroupOut:
        M.UserGroup.check_access(d.db, data.id, d.vid)
        return d.db.query(M.Group).get(data.id)

    @staticmethod
    async def on_groups_get(data: BM, d) -> List[PyG.GroupOut]:
        return d.db.query(M.Group).all()

    @staticmethod
    async def on_members_get(data: BM_ID, d, uids=None) -> List[PyG.MembersOut]:
        res = M.UserGroup.get_members(d.db, data.id)
        uids_ = []
        for r in res:
            uid = str(r['user'].id)
            uids_.append(uid)
            r['user_group'].online = uid in d.mgr.users
        if uids is True:
            return res, uids_
        return res

    # @staticmethod
    # async def on_privacy_put(data: PyG.PrivacyIn, d):
    #     M.UserGroup.put_privacy(d.db, d.vid, data)
    #     await d.mgr.send_other(d, action='groups/members/get', input=data, uids=True)

    @staticmethod
    async def on_groups_post(data: PyG.GroupPost, d) -> PyG.GroupOut:
        g = M.Group.create_group(d.db, data.title, data.text_short, d.vid, data.privacy)
        # TODO what?
        uids = [uid for uid, _ in d.mgr.users.items()]
        await d.mgr.send_other('groups/groups/get', data, d, uids=uids)
        return g

    @staticmethod
    async def on_mine_get(data: BM, d) -> List[PyG.GroupOut]:
        return M.Group.my_groups(d.db, d.vid)

    @staticmethod
    async def on_entries_get(data: BM_ID, d, uids=None) -> List[PyE.EntryGet]:
        # TODO handle uids=[], need to not use d.vid
        res = M.Entry.snoop(d.db, d.vid, d.vid, group_id=data.id).all()
        if uids is True:
            return res, [d.vid]
        return res


groups_router = None
