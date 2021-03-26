import pdb, io, asyncio
from typing import List, Dict, Any
from fastapi import Depends
from app.app_app import app
from app.app_jwt import jwt_user
import sqlalchemy as sa
from sqlalchemy import text
import common.models as M
import pandas as pd
from fastapi.responses import StreamingResponse
from app.utils.http import cant_snoop, send_error, getuser
import common.pydantic.fields as PyF
from common.pydantic.utils import BM, BM_ID
from app.utils.errors import CantSnoop

class Fields:
    @staticmethod
    async def on_fields_get(data: BM, d) -> PyF.FieldsOut:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('Fields')
        await d.mgr.send_other('insights/influencers/get', {}, d)
        return {str(f.id): f for f in d.user.fields}

    @staticmethod
    async def on_history_get(data: BM_ID, d) -> List[PyF.FieldHistoryOut]:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('Fields')
        return M.Field.get_history(d.db, data.id)

    @staticmethod
    async def on_fields_post(data: PyF.FieldPost, d):
        if d.snooping: raise CantSnoop()
        f = M.Field(**data.dict())
        d.user.fields.append(f)
        d.db.commit()
        await d.mgr.send_other('fields/fields/get', {}, d)

    @staticmethod
    async def on_field_put(data: PyF.FieldPut, d):
        if d.snooping: raise CantSnoop()
        f = d.db.query(M.Field).filter_by(user_id=d.vid, id=data.id).first()
        for k, v in data.dict().items():
            if k == 'id': continue
            setattr(f, k, v)
        d.db.commit()
        await d.mgr.send_other('fields/fields/get', {}, d)

    @staticmethod
    async def on_field_exclude(data: PyF.FieldExcludeIn, d):
        if d.snooping: raise CantSnoop()
        f = d.db.query(M.Field).filter_by(user_id=d.vid, id=data.id).first()
        f.excluded_at = data.excluded_at  # just do datetime.utcnow()?
        d.db.commit()
        await d.mgr.send_other('fields/fields/get', {}, d)

    @staticmethod
    async def on_field_delete(data: BM_ID, d):
        if d.snooping: raise CantSnoop()
        d.db.query(M.Field).filter_by(user_id=d.vid, id=data.id).delete()
        d.db.commit()
        await d.mgr.send_other('fields/fields/get', {}, d)

    @staticmethod
    async def on_field_entries_get(data: PyF.FieldEntriesIn, d) -> List[PyF.FieldEntryOut]:
        if d.snooping and not d.user.share_data.fields:
            raise CantSnoop('Fields')
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
        if d.snooping: raise CantSnoop('Fields')
        return d.db.execute(text("""
        select 1 has_dupes from field_entries2 where user_id=:uid and dupes is not null limit 1
        """), dict(uid=d.vid)).fetchone()

    @staticmethod
    async def on_field_entries_clear_dupes_post(data: BM, d) -> Any:
        if d.snooping: raise CantSnoop('Fields')
        db, send = d.db, d.mgr.send_other
        db.execute(text("""
        delete from field_entries where user_id=:uid;
        update field_entries2 set dupes=null, dupe=0 where user_id=:uid
        """), dict(uid=d.vid))
        db.commit()
        await asyncio.wait([
            send('fields/field_entries/has_dupes/get', {}, d),
            send('fields/field_entries/get', {}, d),
        ])

    @staticmethod
    async def on_field_entries_clear_entries_post(data: BM, d) -> Any:
        if d.snooping: raise CantSnoop('Fields')
        db, send = d.db, d.mgr.send_other
        db.execute(text("""
        delete from field_entries where user_id=:uid;
        delete from field_entries2 where user_id=:uid;
        """), dict(uid=d.vid))
        db.commit()
        await asyncio.wait([
            send('fields/field_entries/get', {}, d),
            send('fields/field_entries/has_dupes/get', {}, d)
        ])
        await d.mgr.send_other('fields/field_entries/get', {}, d)


@app.get('/field-entries/csv/{version}')
async def field_entries_csv(
    version: str,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop('Fields')
    if version not in ('new', 'old'):
        return send_error("table must be in (new|old)")

    m = {'new': M.FieldEntry, 'old': M.FieldEntryOld}[version]
    # Can't make direct query, since need field-name decrypted via sqlalchemy
    # https://stackoverflow.com/a/31300355/362790 - load_only from joined tables
    rows = db.session.query(m.created_at, m.value, M.Field) \
        .filter(m.user_id == viewer.id) \
        .join(M.Field, M.Field.id == m.field_id) \
        .order_by(m.created_at.asc()) \
        .all()
    # https://stackoverflow.com/a/61910803/362790
    df = pd.DataFrame([
        dict(name=f.name, date=date, value=value, type=f.type, excluded_at=f.excluded_at,
             default_value=f.default_value, default_value_value=f.default_value_value, service=f.service)
        for (date, value, f) in rows
    ])
    return StreamingResponse(io.StringIO(df.to_csv(index=False)), media_type="text/csv")
