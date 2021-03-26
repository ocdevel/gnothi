from typing import List, Dict, Any
import common.models as M
from app.utils.errors import CantSnoop, GnothiException
from common.pydantic.utils import BM, BM_ID
import common.pydantic.tags as PyT
import common.pydantic.ws as PyW


class Tags:
    @staticmethod
    async def on_tags_get(data: BM, d) -> List[PyT.TagOut]:
        return M.Tag.snoop(d.db, d.vid, d.uid).all()

    @staticmethod
    async def on_tags_post(data: PyT.TagIn, d):
        if d.snooping: raise CantSnoop()
        tag = M.Tag(name=data.name, user_id=d.vid)
        d.db.add(tag)
        d.db.commit()
        # d.db.refresh(tag)
        await d.mgr.send_other('tags/tags/get', {}, d)

    @staticmethod
    async def on_tag_put(data: PyT.TagIn, d):
        if d.snooping: raise CantSnoop()
        tag = d.db.query(M.Tag).filter_by(user_id=d.vid, id=data.id).first()
        data = data.dict()
        for k in ['name', 'selected']:
            if data.get(k): setattr(tag, k, data[k])
        d.db.commit()
        await d.mgr.send_other('tags/tags/get', {}, d)

    @staticmethod
    async def on_tag_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        tagq = d.db.query(M.Tag).filter_by(user_id=d.vid, id=data.id)
        if tagq.first().main:
            raise GnothiException(400, "CANT_DELETE", "Can't delete your main journal")
        tagq.delete()
        d.db.commit()
        await d.mgr.send_other('tags/tags/get', {}, d)

    @staticmethod
    async def on_tag_toggle(data: BM_ID, d):
        if d.snooping:
            row = d.db.query(M.ShareTag)\
                .join(M.Share).join(M.UserShare)\
                .filter(M.UserShare.obj_id == d.vid, M.ShareTag.tag_id == data.id)\
                .first()
        else:
            row = M.Tag.snoop(d.db, d.vid, d.vid) \
                .filter(M.Tag.id == data.id).first()
        if not row:
            return
        row.selected = not row.selected
        d.db.commit()
        await d.mgr.send_other('tags/tags/get', {}, d)
