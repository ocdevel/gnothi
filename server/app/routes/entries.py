import pdb, re, logging, boto3, asyncio
import shortuuid
from typing import List, Dict, Any
from fastapi import File, UploadFile
from app.app_app import app
import sqlalchemy as sa
from sqlalchemy import text
import common.models as M
from urllib.parse import quote as urlencode
from common.pydantic.utils import BM, BM_ORM, BM_ID
from common.pydantic.ws import ResWrap
import common.pydantic.entries as PyE
from common.pydantic.ws import MessageOut
from common.errors import NotFound, CantSnoop, GnothiException
from app.routes.notifs import Notifs

class Entries:
    @staticmethod
    def _entries_put_post(data, d, entry=None):
        vid, db = d.vid, d.db
        data = data.dict()
        if not any(v for k, v in data['tags'].items()):
            raise GnothiException(
                code=400,
                error="MISSING_TAG",
                detail="Each entry must belong to at least one journal"
            )

        new_entry = entry is None
        if new_entry:
            entry = M.Entry(user_id=vid)
            db.add(entry)
        else:
            db.query(M.EntryTag).filter_by(entry_id=entry.id).delete()
        entry.title = data['title']
        entry.text = data['text']
        entry.no_ai = data['no_ai'] or False
        db.commit()
        db.refresh(entry)

        # manual created-at override
        iso_fmt = r"^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$"
        created_at = data.get('created_at', None)
        if created_at and re.match(iso_fmt, created_at):
            tz = M.User.tz(db, vid)
            db.execute(text("""
            update entries set created_at=(:day ::timestamp at time zone :tz)
            where id=:id
            """), dict(day=created_at, tz=tz, id=entry.id))
            db.commit()

        for tag, v in data['tags'].items():
            if not v: continue
            db.add(M.EntryTag(entry_id=entry.id, tag_id=tag))
        db.commit()
        db.refresh(entry)

        # FIXME
        # entry.update_snoopers(d.db)
        M.Entry.run_models(db, entry)
        db.commit()

        return entry

    @staticmethod
    async def on_entries_get(data: BM, d) -> List[PyE.EntryGet]:
        e = M.Entry.snoop(d.db, d.vid, d.uid).all()
        return ResWrap(keyby='id', data=e)

    @staticmethod
    async def on_entries_post(data: PyE.EntryPost, d) -> List[PyE.EntryGet]:
        # background_tasks.add_task(ga, viewer.id, 'feature', 'entry')
        if d.snooping:
            raise CantSnoop()
        entry = Entries._entries_put_post(data, d)
        return ResWrap(id=entry.id, keyby='id', action_as='entries/entries/get', data=[entry], op='prepend')

    @staticmethod
    async def on_entry_get(data: BM_ID, d) -> PyE.EntryGet:
        entry = M.Entry.snoop(d.db, d.vid, d.uid, entry_id=data.id).first()
        if not entry:
            raise NotFound("Entry not found")
        return entry

    # TODO fit this into current system, just threw it in
    @staticmethod
    async def on_entry_cache_get(data: BM_ID, d) -> PyE.CacheEntryGet:
        if d.snooping:
            raise CantSnoop()
        CE = M.CacheEntry
        return d.db.query(CE) \
            .options(sa.orm.load_only(CE.paras, CE.clean)) \
            .filter(CE.entry_id == data.id) \
            .first()

    @staticmethod
    async def on_entry_put(data: PyE.EntryPut, d) -> List[PyE.EntryGet]:
        if d.snooping:
            raise CantSnoop()
        entry = M.Entry.snoop(d.db, d.vid, d.uid, entry_id=data.id).first()
        if not entry:
            raise NotFound("Entry not found")
        entry = Entries._entries_put_post(data, d, entry)
        return ResWrap(keyby='id', action_as='entries/entries/get', data=[entry], op='update')

    @staticmethod
    async def on_entry_delete(data: BM_ID, d) -> Dict:
        if d.snooping:
            raise CantSnoop()

        entry = d.db.query(M.Entry).filter_by(id=data.id, user_id=d.vid)
        if not entry.first():
            raise NotFound("Entry not found")
        entry.delete()
        d.db.commit()
        await d.mgr.exec(d, action='entries/entries/get')
        return {'id': data.id}

    @staticmethod
    async def on_notes_get(data: PyE.NoteGet, d) -> Dict[str, List[PyE.NoteOut]]:
        return M.Note.snoop(d.db, d.vid, entry_id=data.entry_id)

    @staticmethod
    async def on_notes_post(data: PyE.NotePost, d) -> List[PyE.NoteOut]:
        notifs = M.Note.add_note(d.db, d.vid, data)
        await asyncio.wait([
            d.mgr.send_other('entries/notes/get', data, d, uids=[n.user_id for n in notifs]),
            Notifs._send_notifs(d, 'notifs/notes/get', notifs)
        ])

    @staticmethod
    async def on_note_put():
        pass

    @staticmethod
    async def on_note_delete():
        pass


@app.post("/upload-image")
async def upload_image_post(file: UploadFile = File(...)):
    s3 = boto3.client("s3")

    # https://github.com/tiangolo/fastapi/issues/1152
    # s3.put_object(Body=file.file, Bucket='gnothiai.com', ContentType=file.content_type, Key=f"images/{file.filename}")
    key = f"images/{shortuuid.uuid()}-{file.filename}"
    extra = {"ContentType": file.content_type}  # , "ACL": "public-read"}
    s3.upload_fileobj(file.file, "gnothiai.com", key, ExtraArgs=extra)
    url = "https://s3.amazonaws.com/gnothiai.com/"
    return {"filename": f"{url}{urlencode(key)}"}
