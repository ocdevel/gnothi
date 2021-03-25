import pdb, asyncio
from typing import List, Dict, Any
import common.models as M
from common.pydantic.utils import BM, BM_ID
from common.pydantic.ws import MessageOut
from app.utils.errors import CantSnoop


class Notifs:
    @staticmethod
    async def _send_notifs(d, action, notifs):
        if not notifs: return
        return await asyncio.wait([
            d.mgr.send(MessageOut(
                action=action,
                data={str(n.obj_id): n.count}
            ), uids=[n.user_id])
            for n in notifs
        ])

    @staticmethod
    async def on_notes_get(data: BM, d):
        res = d.db.query(M.NoteNotif).filter_by(user_id=d.viewer.id).all()
        await Notifs._send_notifs(d, 'notifs/notes/get', res)

    @staticmethod
    async def on_groups_get(data: BM, d):
        res = d.db.query(M.GroupNotif).filter_by(user_id=d.viewer.id).all()
        await Notifs._send_notifs(d, 'notifs/groups/get', res)
