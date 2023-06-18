import pdb, asyncio
from typing import List, Dict, Any
import common.models as M
from common.pydantic.utils import BM, BM_ID
from common.pydantic.ws import MessageOut
from common.errors import CantSnoop
import sqlalchemy as sa


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
        res = d.db.query(M.NoteNotif).filter_by(user_id=d.vid).all()
        await Notifs._send_notifs(d, 'notifs/notes/get', res)

    @staticmethod
    async def on_groups_get(data: BM, d):
        res = d.db.query(M.GroupNotif).filter_by(user_id=d.vid).all()
        await Notifs._send_notifs(d, 'notifs/groups/get', res)

    @staticmethod
    async def on_groups_seen(data: BM_ID, d):
        d.db.execute(sa.text("""
        update groups_notifs set "count"=0 
        where user_id=:vid and obj_id=:gid
        """), dict(vid=d.vid, gid=data.id))
        d.db.commit()
        await d.mgr.exec(d, "notifs/groups/get")

    @staticmethod
    async def on_notes_seen(data: BM_ID, d):
        d.db.execute(sa.text("""
        update notes_notifs set "count"=0 
        where user_id=:vid and obj_id=:eid
        """), dict(vid=d.vid, eid=data.id))
        d.db.commit()
        await d.mgr.exec(d, "notifs/notes/get")
