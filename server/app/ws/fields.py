import pdb, io, asyncio
from typing import List, Dict, Any
from sqlalchemy import text
import common.models as M
import common.pydantic.fields as PyF
from common.pydantic.utils import BM, BM_ID
from common.errors import CantSnoop

class Fields:
    @staticmethod
    async def on_fields_get(data: BM, d) -> PyF.FieldsOut:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('fields')
        await d.mgr.exec(d, action='insights/influencers/get')
        return {str(f.id): f for f in d.user.fields}

    @staticmethod
    async def on_history_get(data: BM_ID, d) -> List[PyF.FieldHistoryOut]:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('fields')
        return M.Field.get_history(d.db, data.id)

    @staticmethod
    async def on_fields_post(data: PyF.FieldPost, d):
        if d.snooping: raise CantSnoop()
        f = M.Field(**data.dict())
        d.user.fields.append(f)
        d.db.commit()
        await d.mgr.exec(d, action='fields/fields/get')

    @staticmethod
    async def on_field_put(data: PyF.FieldPut, d):
        if d.snooping: raise CantSnoop()
        f = d.db.query(M.Field).filter_by(user_id=d.vid, id=data.id).first()
        for k, v in data.dict().items():
            if k == 'id': continue
            setattr(f, k, v)
        d.db.commit()
        await d.mgr.exec(d, action='fields/fields/get')

    @staticmethod
    async def on_field_exclude(data: PyF.FieldExcludeIn, d):
        if d.snooping: raise CantSnoop()
        f = d.db.query(M.Field).filter_by(user_id=d.vid, id=data.id).first()
        f.excluded_at = data.excluded_at  # just do datetime.utcnow()?
        d.db.commit()
        await d.mgr.exec(d, 'fields/fields/get')

    @staticmethod
    async def on_field_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        d.db.query(M.Field).filter_by(user_id=d.vid, id=data.id).delete()
        d.db.commit()
        await d.mgr.exec(d, action='fields/fields/get')

    @staticmethod
    async def on_field_entries_get(data: PyF.FieldEntriesIn, d) -> List[PyF.FieldEntryOut]:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('fields')
        return M.FieldEntry.get_day_entries(d.db, d.uid, day=data.day)

    @staticmethod
    async def on_field_entries_post(data: PyF.FieldEntryIn, d) -> PyF.FieldEntryOut:
        if d.snooping: raise CantSnoop()
        fe = M.FieldEntry.upsert(d.db, d.vid, data.id, data.value, data.day)
        M.Field.update_avg(d.db, data.id)
        return fe

    # Note: field-entries/action need to come before field-entries/{field_id}

    @staticmethod
    async def on_field_entries_has_dupes_get(data: BM, d) -> Any:
        if d.snooping: raise CantSnoop()
        return d.db.execute(text("""
        select 1 has_dupes from field_entries2 where user_id=:uid and dupes is not null limit 1
        """), dict(uid=d.vid)).fetchone()

    @staticmethod
    async def on_field_entries_clear_dupes_post(data: BM, d) -> Any:
        if d.snooping: raise CantSnoop()
        db, send = d.db, d.mgr.exec
        db.execute(text("""
        delete from field_entries where user_id=:uid;
        update field_entries2 set dupes=null, dupe=0 where user_id=:uid
        """), dict(uid=d.vid))
        db.commit()
        await asyncio.wait([
            send(d, action='fields/field_entries/has_dupes/get'),
            send(d, action='fields/field_entries/get'),
        ])

    @staticmethod
    async def on_field_entries_clear_entries_post(data: BM, d) -> Any:
        if d.snooping: raise CantSnoop()
        db, send = d.db, d.mgr.exec
        db.execute(text("""
        delete from field_entries where user_id=:uid;
        delete from field_entries2 where user_id=:uid;
        """), dict(uid=d.vid))
        db.commit()
        await asyncio.wait([
            send(d, action='fields/field_entries/get'),
            send(d, action='fields/field_entries/has_dupes/get')
        ])
        await send(d, action='fields/field_entries/get')
