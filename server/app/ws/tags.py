from typing import List, Dict, Any
import common.models as M
from common.errors import CantSnoop, GnothiException
from common.pydantic.utils import BM, BM_ID
import common.pydantic.tags as PyT
import common.pydantic.ws as PyW
import sqlalchemy as sa

class Tags:
    @staticmethod
    async def on_tags_get(data: BM, d) -> List[PyT.TagOut]:
        return M.Tag.snoop(d.db, d.vid, d.uid).all()

    @staticmethod
    async def on_tags_post(data: PyT.TagIn, d):
        if d.snooping: raise CantSnoop()
        db = d.db
        last = db.query(sa.func.max(M.Tag.order)).filter_by(user_id=d.vid).scalar()
        tag = M.Tag(name=data.name, user_id=d.vid, order=last + 1)
        db.add(tag)
        db.commit()
        await d.mgr.exec(d, action='tags/tags/get')

    @staticmethod
    async def on_tag_put(data: PyT.TagPut, d):
        if d.snooping: raise CantSnoop()
        tag = d.db.query(M.Tag).filter_by(user_id=d.vid, id=data.id).first()
        data = data.dict()
        for k, v in data.items():
            if k == 'id': continue
            setattr(tag, k, data[k])
        d.db.commit()
        await d.mgr.exec(d, 'tags/tags/get')

    @staticmethod
    async def on_tag_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        tagq = d.db.query(M.Tag).filter_by(user_id=d.vid, id=data.id)
        if tagq.first().main:
            raise GnothiException(400, "CANT_DELETE", "Can't delete your main journal")
        tagq.delete()
        d.db.commit()
        await d.mgr.exec(d, 'tags/tags/get')

    @staticmethod
    async def on_tags_reorder(data: PyT.TagsOrder, d):
        if d.snooping: raise CantSnoop()
        d.db.bulk_update_mappings(M.Tag, [x.dict() for x in data])
        d.db.commit()
        await d.mgr.exec(d, 'tags/tags/get')

    @staticmethod
    async def on_tag_toggle(data: BM_ID, d):
        if d.snooping:
            row = d.db.query(M.ShareTag)\
                .join(M.Share).join(M.ShareUser)\
                .filter(M.ShareUser.obj_id == d.vid, M.ShareTag.tag_id == data.id)\
                .first()
        else:
            row = M.Tag.snoop(d.db, d.vid, d.vid) \
                .filter(M.Tag.id == data.id).first()
        if not row:
            return
        row.selected = not row.selected
        d.db.commit()
        await d.mgr.exec(d, 'tags/tags/get')
