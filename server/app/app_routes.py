import pdb, re, datetime, logging, boto3, io
import shortuuid
import dateutil.parser
from typing import List, Dict, Any
from fastapi import Depends, HTTPException, File, UploadFile, BackgroundTasks, WebSocket
from app.app_app import app
from app.app_jwt import fastapi_users, jwt_user
from app.app_stripe import stripe_router
from app.app_groups import groups
from fastapi_sqlalchemy import db  # an object to provide global access to a database session
import sqlalchemy as sa
from sqlalchemy import text
import common.models as M
from common.utils import SECRET
from app import habitica
from app import ml
from urllib.parse import quote as urlencode
from app.google_analytics import ga
import pandas as pd
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

getuser = M.User.snoop

app.include_router(stripe_router, prefix='/stripe')


def send_error(message: str, code: int = 400):
    raise HTTPException(status_code=code, detail=message)


def cant_snoop(feature=None):
    message = f"{feature} isn't shared" if feature else "This feature isn't shared"
    return send_error(message, 401)


@app.get('/health')
def health_get():
    return {'ok': True}


@app.get('/user', response_model=M.SOUser)
def user_get(as_user: str = None,  viewer = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()  # FIXME not handling this?
    return user


@app.get('/user/checkin')
def checkin_get(
    background_tasks: BackgroundTasks,
    viewer: M.User = Depends(jwt_user),
):
    background_tasks.add_task(ga, viewer.id, 'user', 'checkin')
    sql = text(f"update users set updated_at=now() where id=:uid")
    db.session.execute(sql, {'uid': viewer.id})
    db.session.commit()
    return {}

@app.get('/profile', response_model=M.SOProfile)
def profile_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user


@app.put('/profile/timezone')
def profile_timezone_put(data: M.SITimezone, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    user.timezone = data.timezone
    db.session.commit()
    return {}


@app.put('/profile', response_model=M.SOProfile)
def profile_put(
    data: M.SIProfile,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    if data.therapist:
        background_tasks.add_task(ga, viewer.id, 'user', 'therapist')
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    for k, v in data.dict().items():
        v = v or None  # remove empty strings
        if k == 'paid': continue
        setattr(user, k, v)
    db.session.commit()
    M.Job.create_job(method='profiles', data_in={'args': [str(user.id)]})
    return user


@app.get('/people', response_model=List[M.SOPerson])
def people_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user.people


@app.post('/people')
def people_post(data: M.SIPerson, as_user: str = None,  viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    p = M.Person(**data.dict())
    user.people.append(p)
    db.session.commit()
    return {}


@app.put('/people/{person_id}')
def person_put(data: M.SIPerson, person_id: str, as_user: str = None,  viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    # TODO and share_id = ...
    p = db.session.query(M.Person).filter_by(user_id=user.id, id=person_id).first()
    for k, v in data.dict().items():
        setattr(p, k, v)
    db.session.commit()
    return {}


@app.delete('/people/{person_id}')
def person_delete(person_id: str, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    pq = db.session.query(M.Person).filter_by(user_id=user.id, id=person_id)
    pq.delete()
    db.session.commit()
    return {}


@app.get('/tags', response_model=List[M.SOTag])
def tags_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    tags = M.Tag.snoop(viewer.email, user.id, snooping=snooping).all()
    return tags


@app.post('/tags', response_model=M.SOTag)
def tags_post(data: M.SITag, as_user: str = None,  viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    tag = M.Tag(name=data.name, user_id=user.id)
    db.session.add(tag)
    db.session.commit()
    db.session.refresh(tag)
    return tag


@app.put('/tags/{tag_id}')
def tag_put(tag_id, data: M.SITag, as_user: str = None,  viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    tag = db.session.query(M.Tag).filter_by(user_id=user.id, id=tag_id).first()
    data = data.dict()
    for k in ['name', 'selected']:
        if data.get(k): setattr(tag, k, data[k])
    db.session.commit()
    return {}


@app.delete('/tags/{tag_id}')
def tag_delete(tag_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    tagq = db.session.query(M.Tag).filter_by(user_id=user.id, id=tag_id)
    if tagq.first().main:
        return send_error("Can't delete your main journal")
    tagq.delete()
    db.session.commit()
    return {}


@app.post('/tags/{tag_id}/toggle')
def tag_toggle(tag_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping:
        row = db.session.query(M.ShareTag)\
            .join(M.Share)\
            .filter(M.Share.email == viewer.email, M.ShareTag.tag_id == tag_id)\
            .first()
    else:
        row = M.Tag.snoop(viewer.email, user.id, snooping=snooping) \
            .filter(M.Tag.id == tag_id).first()
    if not row: return
    row.selected = not row.selected
    db.session.commit()
    return row


@app.get('/shares', response_model=List[M.SOShare])
def shares_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return db.session.query(M.Share).filter_by(user_id=user.id).all()


def shares_put_post(user, data, share_id=None):
    data = data.dict()
    tags = data.pop('tags')
    data['fields'] = data['fields_']; del data['fields_']  # pydantic conflict
    if share_id:
        s = db.session.query(M.Share).filter_by(user_id=user.id, id=share_id).first()
        db.session.query(M.ShareTag).filter_by(share_id=s.id).delete()
        for k, v in data.items():
            setattr(s, k, v)
    else:
        s = M.Share(user_id=user.id, **data)
        db.session.add(s)
    db.session.commit()
    for tag, v in tags.items():
        if not v: continue
        db.session.add(M.ShareTag(share_id=s.id, tag_id=tag))
    db.session.commit()
    return {}


@app.post('/shares')
def shares_post(
    data: M.SIShare,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    background_tasks.add_task(ga, viewer.id, 'feature', 'share')
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return shares_put_post(user, data)


@app.put('/shares/{share_id}')
def share_put(share_id, data: M.SIShare, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return shares_put_post(user, data, share_id)


@app.delete('/shares/{share_id}')
def share_delete(share_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    db.session.query(M.Share).filter_by(user_id=user.id, id=share_id).delete()
    db.session.commit()
    return {}


def entries_put_post(user, data: M.SIEntry, entry=None):
    data = data.dict()
    if not any(v for k,v in data['tags'].items()):
        return send_error('Each entry must belong to at least one journal')

    new_entry = entry is None
    if new_entry:
        entry = M.Entry(user_id=user.id)
        db.session.add(entry)
    else:
        db.session.query(M.EntryTag).filter_by(entry_id=entry.id).delete()
    entry.title = data['title']
    entry.text = data['text']
    entry.no_ai = data['no_ai'] or False
    db.session.commit()
    db.session.refresh(entry)

    # manual created-at override
    iso_fmt = r"^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$"
    created_at = data.get('created_at', None)
    if created_at and re.match(iso_fmt, created_at):
        tz = M.User.tz(db.session, user.id)
        db.session.execute(text("""
        update entries set created_at=(:day ::timestamp at time zone :tz) 
        where id=:id 
        """), dict(day=created_at, tz=tz, id=entry.id))
        db.session.commit()

    for tag, v in data['tags'].items():
        if not v: continue
        db.session.add(M.EntryTag(entry_id=entry.id, tag_id=tag))
    db.session.commit()
    db.session.refresh(entry)

    entry.update_snoopers()
    entry.run_models()
    db.session.commit()

    return entry


@app.post("/upload-image")
async def upload_image_post(file: UploadFile = File(...)):
    s3 = boto3.client("s3")

    # https://github.com/tiangolo/fastapi/issues/1152
    # s3.put_object(Body=file.file, Bucket='gnothiai.com', ContentType=file.content_type, Key=f"images/{file.filename}")
    key = f"images/{shortuuid.uuid()}-{file.filename}"
    extra = {"ContentType": file.content_type} # , "ACL": "public-read"}
    s3.upload_fileobj(file.file, "gnothiai.com", key, ExtraArgs=extra)
    url = "https://s3.amazonaws.com/gnothiai.com/"
    return {"filename": f"{url}{urlencode(key)}"}


@app.get('/entries', response_model=List[M.SOEntry])
def entries_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    return M.Entry.snoop(viewer.email, user.id, snooping=snooping).all()


@app.post('/entries', response_model=M.SOEntry)
def entries_post(
    data: M.SIEntry,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    background_tasks.add_task(ga, viewer.id, 'feature', 'entry')
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return entries_put_post(user, data)


@app.get('/entries/{entry_id}', response_model=M.SOEntry)
def entry_get(entry_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    entry = M.Entry.snoop(viewer.email, user.id, snooping=snooping, entry_id=entry_id).first()
    if not entry: return send_error("Entry not found", 404)
    return entry


# TODO fit this into current system, just threw it in
@app.get('/entries/{entry_id}/cache')
def cache_entry_get(entry_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    CE = M.CacheEntry
    return db.session.query(CE)\
        .options(sa.orm.load_only(CE.paras, CE.clean))\
        .filter(CE.entry_id==entry_id)\
        .first()


@app.put('/entries/{entry_id}', response_model=M.SOEntry)
def entry_put(entry_id, data: M.SIEntry, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    entry = M.Entry.snoop(viewer.email, user.id, entry_id=entry_id).first()
    if not entry: return send_error("Entry not found", 404)
    return entries_put_post(user, data, entry)


@app.delete('/entries/{entry_id}')
def entry_delete(entry_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    entry = db.session.query(M.Entry).filter_by(id=entry_id, user_id=viewer.id)
    if not entry.first():
        return send_error("Entry not found", 404)
    entry.delete()
    db.session.commit()
    return {}


@app.get('/notes', response_model=List[M.SONote])
def notes_get_all(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    return []  # FIXME
    user, snooping = getuser(viewer, as_user)
    # TODO handle snooping
    return db.session.query(M.Note).filter_by(user_id=viewer.id).all()


@app.get('/entries/{entry_id}/notes', response_model=List[M.SONote])
def notes_get(entry_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    # TODO handle snooping
    return M.Note.snoop(viewer.id, user.id, entry_id).all()


@app.post('/entries/{entry_id}/notes', response_model=List[M.SONote])
def notes_post(
    entry_id,
    data: M.SINote,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user),
):
    user, snooping = getuser(viewer, as_user)
    # TODO handle snooping
    n = M.Note(user_id=viewer.id, entry_id=entry_id, **data.dict())
    db.session.add(n)
    db.session.commit()
    background_tasks.add_task(ga, viewer.id, 'feature', 'notes')
    return M.Note.snoop(viewer.id, user.id, entry_id).all()

# TODO
def note_put(): pass
def note_delete(): pass

@app.get('/fields', response_model=M.SOFields)
def fields_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    return {f.id: f for f in user.fields}


@app.get('/fields/{field_id}/history', response_model=List[M.SOFieldHistory])
def field_history_get(field_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    return M.Field.get_history(field_id)


@app.post('/fields')
def fields_post(data: M.SIField, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = M.Field(**data.dict())
    user.fields.append(f)
    db.session.commit()
    db.session.refresh(f)
    return f


@app.put('/fields/{field_id}')
def field_put(field_id, data: M.SIField, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    for k, v in data.dict().items():
        setattr(f, k, v)
    db.session.commit()
    return {}

@app.put('/fields/{field_id}/exclude')
def field_put(field_id, data: M.SIFieldExclude, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    f.excluded_at = data.excluded_at  # just do datetime.utcnow()?
    db.session.commit()
    return {}


@app.delete('/fields/{field_id}')
def field_delete(field_id, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).delete()
    db.session.commit()
    return {}


@app.get('/field-entries')
def field_entries_get(
    day: str = None,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    return M.FieldEntry.get_day_entries(db.session, user.id, day=day)


# Note: field-entries/action need to come before field-entries/{field_id}

@app.get('/field-entries/has-dupes')
def field_entries_has_dupes_get(
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop('Fields')
    return db.session.execute(text("""
    select 1 has_dupes from field_entries2 where user_id=:uid and dupes is not null limit 1
    """), dict(uid=viewer.id)).fetchone()


@app.post('/field-entries/clear-dupes')
def field_entries_clear_dupes_post(
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop('Fields')
    db.session.execute(text("""
    delete from field_entries where user_id=:uid;
    update field_entries2 set dupes=null, dupe=0 where user_id=:uid
    """), dict(uid=viewer.id))
    db.session.commit()
    return {}

@app.post('/field-entries/clear-entries')
def field_entries_clear_entries_post(
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop('Fields')
    db.session.execute(text("""
    delete from field_entries where user_id=:uid;
    delete from field_entries2 where user_id=:uid;
    """), dict(uid=viewer.id))
    db.session.commit()
    return {}


@app.get('/field-entries/csv/{version}')
def field_entries_csv(
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
    rows = db.session.query(m.created_at, m.value, M.Field)\
        .filter(m.user_id==viewer.id)\
        .join(M.Field, M.Field.id==m.field_id)\
        .order_by(m.created_at.asc())\
        .all()
    # https://stackoverflow.com/a/61910803/362790
    df = pd.DataFrame([
        dict(name=f.name, date=date, value=value, type=f.type, excluded_at=f.excluded_at,
             default_value=f.default_value, default_value_value=f.default_value_value, service=f.service)
        for (date, value, f) in rows
    ])
    return StreamingResponse(io.StringIO(df.to_csv(index=False)), media_type="text/csv")


@app.post('/field-entries/{field_id}')
def field_entries_post(
    field_id,
    data: M.SIFieldEntry,
    day: str = None,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    fe = M.FieldEntry.upsert(db.session, user.id, field_id, data.value, day)
    M.Field.update_avg(field_id)
    return fe


@app.get('/therapists', response_model=List[M.SOProfile])
def therapists_get(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return db.session.query(M.User)\
        .join(M.ProfileMatch, M.User.id == M.ProfileMatch.match_id)\
        .filter(M.ProfileMatch.user_id == user.id)\
        .order_by(M.ProfileMatch.score.asc())\
        .all()


@app.get('/influencers')
def influencers_get(
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    rows = db.session.query(M.Influencer)\
        .join(M.Field, M.Field.id == M.Influencer.influencer_id)\
        .filter(M.Field.user_id == user.id).all()
    obj = {}
    for r in rows:
        if r.field_id not in obj:
            obj[r.field_id] = {}
        obj[r.field_id][r.influencer_id] = r.score
    return obj


@app.get('/await-job/{jid}')
def await_job_get(
    jid: str,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    # TODO insecure; doesn't authenticate job to user. Need to add job.user_id or such
    job = ml.await_job(jid)
    method, res = job.method, job.data_out
    if method == 'themes':
        if res is False: return []  # fixme
        if len(res) == 0:
            return send_error("No patterns found in your entries yet, come back later")
        return res
    if method == 'question-answering':
        if res is False:
            return [{'answer': ml.OFFLINE_MSG}]
        return res
    if method == 'summarization':
        if res is False:
            return {"summary": ml.OFFLINE_MSG, "sentiment": None}
        res = res[0]
        if not res["summary"]:
            return {"summary": "Nothing to summarize (try adjusting date range)"}
        return {'summary': res["summary"], 'sentiment': res["sentiment"]}


@app.post('/themes')
def themes_post(
    data: M.SIThemes,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    background_tasks.add_task(ga, viewer.id, 'feature', 'themes')
    user, snooping = getuser(viewer, as_user)
    entries = M.Entry.snoop(
        viewer.email,
        user.id,
        snooping=snooping,
        days=data.days,
        tags=data.tags,
        for_ai=True
    )
    eids = [str(e.id) for e in entries.all()]

    # For dreams, special handle: process every sentence. TODO make note in UI
    # tags = request.get_json().get('tags', None)
    # if tags and len(tags) == 1:
    #     tag_name = Tag.query.get(tags[0]).name
    #     if re.match('dream(s|ing)?', tag_name, re.IGNORECASE):
    #         entries = [s.text for e in entries for s in e.sents]

    if len(eids) < 2:
        return send_error("Not enough entries to work with, come back later")
    return ml.submit_job('themes', dict(args=[eids], kwargs={'algo': data.algo}))


@app.post('/ask')
def question_post(
    data: M.SIQuestion,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    background_tasks.add_task(ga, viewer.id, 'feature', 'ask')
    user, snooping = getuser(viewer, as_user)
    question = data.question
    context = M.Entry.snoop(
        viewer.email,
        user.id,
        snooping=snooping,
        days=data.days,
        tags=data.tags,
        for_ai=True
    )

    w_profile = (not snooping) or user.share_data.profile
    profile_id = user.id if w_profile else None
    context = M.CacheEntry.get_paras(context, profile_id=profile_id)

    return ml.submit_job('question-answering', dict(args=[question, context]))


@app.post('/summarize')
def summarize_post(
    data: M.SISummarize,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    background_tasks.add_task(ga, viewer.id, 'feature', 'summarize')
    user, snooping = getuser(viewer, as_user)
    entries = M.Entry.snoop(
        viewer.email,
        user.id,
        snooping=snooping,
        days=data.days,
        tags=data.tags,
        for_ai=True
    )
    entries = M.CacheEntry.get_paras(entries)

    min_ = int(data.words / 2)
    kwargs = dict(min_length=min_, max_length=data.words)
    return ml.submit_job('summarization', dict(args=[entries], kwargs=kwargs))


@app.post('/books/{bid}/{shelf}')
def bookshelf_post(
    bid,
    shelf,
    background_tasks: BackgroundTasks,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    background_tasks.add_task(ga, viewer.id, 'bookshelf', shelf)
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.books:
        return cant_snoop('Books')
    M.Bookshelf.upsert(user.id, bid, shelf)
    return {}


@app.get('/books/{shelf}')
def bookshelf_get(
    shelf,
    as_user: str = None,
    viewer: M.User = Depends(jwt_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.books:
        return cant_snoop('Books')
    return M.Bookshelf.get_shelf(user.id, shelf)

@app.get('/top-books')
def top_books_get(
    # just require some login
    viewer: M.User = Depends(jwt_user)
):
    return M.Bookshelf.top_books()


@app.post('/habitica')
def habitica_post(data: M.SIHabitica, as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    user.habitica_user_id = data.habitica_user_id
    user.habitica_api_token = data.habitica_api_token
    db.session.commit()
    habitica.sync_for(user)
    return {}

@app.delete('/habitica')
def habitica_delete(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    db.session.execute(text("""
    update users set habitica_user_id=null, habitica_api_token=null where id=:uid;
    delete from fields where service='habitica' and user_id=:uid;
    """), dict(uid=viewer.id))
    db.session.commit()
    return {}


@app.post('/habitica/sync')
def habitica_sync_post(as_user: str = None, viewer: M.User = Depends(jwt_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    if not user.habitica_user_id:
        return {}
    habitica.sync_for(user)
    return {}


@app.get('/stats')
def stats_get():
    exec = db.session.execute
    users = exec("select count(*) ct from users").fetchone().ct
    therapists = exec("select count(*) ct from users where therapist=true").fetchone().ct
    books = exec("""
    select s.shelf
    from books b
    inner join bookshelf s on b.id=s.book_id
    inner join users u on u.id=s.user_id
    where s.shelf not in ('ai', 'cosine')
        and u.is_superuser is not true
        and b.amazon is null
    order by s.created_at desc;
    """).fetchall()
    return dict(
        users=users,
        therapists=therapists,
        upvotes=sum([1 for b in books if b.shelf in ('like', 'already_read', 'recommend')]),
        downvotes=sum([1 for b in books if b.shelf in ('dislike', 'remove')]),
    )
