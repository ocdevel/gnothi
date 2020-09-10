import pdb, re, datetime, logging, boto3
import shortuuid
import dateutil.parser
from typing import List, Dict, Any
from fastapi import Depends, HTTPException, File, UploadFile
from app.app_app import app
from app.app_jwt import fastapi_users
from fastapi_sqlalchemy import db  # an object to provide global access to a database session
from sqlalchemy import text
from common.utils import utcnow
import common.models as M
from app import habitica
from app.ec2_updown import jobs_status
from app import ml
from urllib.parse import quote as urlencode

logger = logging.getLogger(__name__)

# Remove this after SES email working
from passlib.hash import pbkdf2_sha256
from fastapi_users.password import get_password_hash

getuser = M.User.snoop


def send_error(message: str, code: int = 400):
    raise HTTPException(status_code=code, detail=message)


def cant_snoop(feature=None):
    message = f"{feature} isn't shared" if feature else "This feature isn't shared"
    return send_error(message, 401)


@app.post('/check-pass-remove-this')
def check_pw_post(data: M.FU_UserCreate):
    user = db.session.query(M.User).filter_by(email=data.email).first()
    if not user: return {}
    try:
        # raises if hashed_password not pbkdf2-style, so piggy-backing on raise
        if not pbkdf2_sha256.verify(data.password, user.hashed_password): raise
    except:
        logger.info("Password not in old system")
        return {}
    logger.info("Password in old system, updating")
    user.hashed_password = get_password_hash(data.password)
    db.session.commit()
    return {}


@app.get('/jobs-status')
def jobs_status_get(viewer: M.User = Depends(fastapi_users.get_current_user)):
    return jobs_status()

 
@app.get('/user', response_model=M.SOUser)
def user_get(as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()  # FIXME not handling this?
    return user

@app.post('/user/checkin')
def checkin_get(viewer: M.User = Depends(fastapi_users.get_current_user)):
    sql = text(f"update users set updated_at={utcnow} where id=:uid")
    db.session.execute(sql, {'uid': viewer.id})
    db.session.commit()
    return {}

@app.get('/profile', response_model=M.SOProfile)
def profile_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user


@app.put('/profile/timezone')
def profile_timezone_put(data: M.SITimezone, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    user.timezone = data.timezone
    db.session.commit()
    return {}


@app.put('/profile')
def profile_put(data: M.SIProfile, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    for k, v in data.dict().items():
        v = v or None  # remove empty strings
        setattr(user, k, v)
    db.session.add(M.Job(method='profile', data_in={'args': [str(user.id)]}))
    db.session.commit()
    return {}


@app.get('/people', response_model=List[M.SOPerson])
def people_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user.people


@app.post('/people')
def people_post(data: M.SIPerson, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    p = M.Person(**data.dict())
    user.people.append(p)
    db.session.commit()
    return {}


@app.put('/people/{person_id}')
def person_put(data: M.SIPerson, person_id: str, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    # TODO and share_id = ...
    p = db.session.query(M.Person).filter_by(user_id=user.id, id=person_id).first()
    for k, v in data.dict().items():
        setattr(p, k, v)
    db.session.commit()
    return {}


@app.delete('/people/{person_id}')
def person_delete(person_id: str, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    pq = db.session.query(M.Person).filter_by(user_id=user.id, id=person_id)
    pq.delete()
    db.session.commit()
    return {}


@app.get('/tags', response_model=List[M.SOTag])
def tags_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    return M.Tag.snoop(viewer.email, user.id, snooping=snooping).all()


@app.post('/tags', response_model=M.SOTag)
def tags_post(data: M.SITag, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    tag = M.Tag(name=data.name, user_id=user.id)
    db.session.add(tag)
    db.session.commit()
    db.session.refresh(tag)
    return tag


@app.put('/tags/{tag_id}')
def tag_put(tag_id, data: M.SITag, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    tag = db.session.query(M.Tag).filter_by(user_id=user.id, id=tag_id).first()
    data = data.dict()
    for k in ['name', 'selected']:
        if data.get(k): setattr(tag, k, data[k])
    db.session.commit()
    return {}


@app.delete('/tags/{tag_id}')
def tag_delete(tag_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    tagq = db.session.query(M.Tag).filter_by(user_id=user.id, id=tag_id)
    if tagq.first().main:
        return send_error("Can't delete your main journal")
    tagq.delete()
    db.session.commit()
    return {}


@app.get('/shares', response_model=List[M.SOShare])
def shares_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
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
def shares_post(data: M.SIShare, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return shares_put_post(user, data)


@app.put('/shares/{share_id}')
def share_put(share_id, data: M.SIShare, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return shares_put_post(user, data, share_id)


@app.delete('/shares/{share_id}')
def share_delete(share_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    db.session.query(M.Share).filter_by(user_id=user.id, id=share_id).delete()
    db.session.commit()
    return {}


def entries_put_post(user, data: M.SIEntry, entry=None):
    data = data.dict()
    if not any(v for k,v in data['tags'].items()):
        return send_error('Each entry must belong to at least one journal')

    if entry:
        db.session.query(M.EntryTag).filter_by(entry_id=entry.id).delete()
    else:
        entry = M.Entry(user_id=user.id)
        db.session.add(entry)
    entry.title = data['title']
    entry.text = data['text']
    entry.no_ai = data['no_ai'] or False

    # Manual date submission
    iso_fmt = r"^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])$"
    ca = data['created_at']
    if ca and re.match(iso_fmt, ca):
        entry.created_at = dateutil.parser.parse(ca)

    # entry needs id, prior tags need deleting
    db.session.commit()
    for tag, v in data['tags'].items():
        if not v: continue
        db.session.add(M.EntryTag(entry_id=entry.id, tag_id=tag))
    # commit above first, in case run-models crashes
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
def entries_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    return M.Entry.snoop(viewer.email, user.id, snooping=snooping).all()


@app.post('/entries', response_model=M.SOEntry)
def entries_post(data: M.SIEntry, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return entries_put_post(user, data)


@app.get('/entries/{entry_id}', response_model=M.SOEntry)
def entry_get(entry_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    entry = M.Entry.snoop(viewer.email, user.id, snooping=snooping, entry_id=entry_id).first()
    if not entry: return send_error("Entry not found", 404)
    return entry


@app.put('/entries/{entry_id}', response_model=M.SOEntry)
def entry_put(entry_id, data: M.SIEntry, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    entry = M.Entry.snoop(viewer.email, user.id, entry_id=entry_id).first()
    if not entry: return send_error("Entry not found", 404)
    return entries_put_post(user, data, entry)


@app.delete('/entries/{entry_id}')
def entry_delete(entry_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    entry = db.session.query(M.Entry).filter_by(id=entry_id, user_id=viewer.id)
    if not entry.first():
        return send_error("Entry not found", 404)
    entry.delete()
    db.session.commit()
    return {}


@app.get('/notes', response_model=List[M.SONote])
def notes_get_all(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    return []  # FIXME
    user, snooping = getuser(viewer, as_user)
    # TODO handle snooping
    return db.session.query(M.Note).filter_by(user_id=viewer.id).all()


@app.get('/entries/{entry_id}/notes', response_model=List[M.SONote])
def notes_get(entry_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    # TODO handle snooping
    return M.Note.snoop(viewer.id, user.id, entry_id).all()


@app.post('/entries/{entry_id}/notes', response_model=List[M.SONote])
def notes_post(entry_id, data: M.SINote, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    # TODO handle snooping
    n = M.Note(user_id=viewer.id, entry_id=entry_id, **data.dict())
    db.session.add(n)
    db.session.commit()
    return M.Note.snoop(viewer.id, user.id, entry_id).all()

# TODO
def note_put(): pass
def note_delete(): pass

@app.get('/fields') #, response_model=M.SOFields)
def fields_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    return {f.id: f.json() for f in user.fields}
    # return user.fields


@app.post('/fields')
def fields_post(data: M.SIField, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = M.Field(**data.dict())
    user.fields.append(f)
    db.session.commit()
    db.session.refresh(f)
    return f


@app.put('/fields/{field_id}')
def field_put(field_id, data: M.SIField, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    for k, v in data.dict().items():
        setattr(f, k, v)
    db.session.commit()
    return {}

@app.put('/fields/{field_id}/exclude')
def field_put(field_id, data: M.SIFieldExclude, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    f.excluded_at = data.excluded_at  # just do datetime.utcnow()?
    db.session.commit()
    return {}


@app.delete('/fields/{field_id}')
def field_delete(field_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).delete()
    db.session.commit()
    return {}


@app.get('/field-entries')
def field_entries_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    res = M.FieldEntry.get_today_entries(user.id).all()
    return {f.field_id: f.value for f in res}


@app.post('/field-entries/{field_id}')
def field_entries_post(field_id, data: M.SIFieldEntry, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    fe = M.FieldEntry.get_today_entries(user.id, field_id).first()
    v = float(data.value)
    if fe:
        fe.value = v
    if not fe:
        fe = M.FieldEntry(value=v, field_id=field_id)
        user.field_entries.append(fe)
    db.session.commit()
    return {}


@app.get('/influencers')
def influencers_get(
    target: str = None,
    as_user: str = None,
    viewer: M.User = Depends(fastapi_users.get_current_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    row = db.session.query(M.CacheUser)\
        .with_entities(M.CacheUser.influencers)\
        .filter_by(user_id=user.id).first()
    if not (row and row.influencers): return {}
    targets, all_imps, next_preds = row.influencers
    return {'overall': all_imps, 'per_target': targets, 'next_preds': next_preds}


@app.post('/themes')
def themes_post(
    data: M.SILimitEntries,
    as_user: str = None,
    viewer: M.User = Depends(fastapi_users.get_current_user)
):
    user, snooping = getuser(viewer, as_user)
    entries = M.Entry.snoop(
        viewer.email,
        user.id,
        snooping=snooping,
        days=data.days,
        tags=data.tags,
        for_ai=True
    )
    entries = [str(e.id) for e in entries.all()]

    # For dreams, special handle: process every sentence. TODO make note in UI
    # tags = request.get_json().get('tags', None)
    # if tags and len(tags) == 1:
    #     tag_name = Tag.query.get(tags[0]).name
    #     if re.match('dream(s|ing)?', tag_name, re.IGNORECASE):
    #         entries = [s.text for e in entries for s in e.sents]

    if len(entries) < 2:
        return send_error("Not enough entries to work with, come back later")
    data = ml.themes(entries)
    if len(data) == 0:
        return send_error("No patterns found in your entries yet, come back later")
    return data


@app.post('/query')
def question_post(
    data: M.SIQuestion,
    as_user: str = None,
    viewer: M.User = Depends(fastapi_users.get_current_user)
):
    user, snooping = getuser(viewer, as_user)
    question = data.query
    entries = M.Entry.snoop(
        viewer.email,
        user.id,
        snooping=snooping,
        days=data.days,
        tags=data.tags,
        for_ai=True
    )
    entries = [e.text for e in entries]

    if (not snooping) or user.share_data.profile:
        entries = [user.profile_to_text()] + entries

    return ml.query(question, entries)


@app.post('/summarize')
def summarize_post(
    data: M.SISummarize,
    as_user: str = None,
    viewer: M.User = Depends(fastapi_users.get_current_user)
):
    user, snooping = getuser(viewer, as_user)
    entries = M.Entry.snoop(
        viewer.email,
        user.id,
        snooping=snooping,
        days=data.days,
        tags=data.tags,
        for_ai=True
    )

    entries = ' '.join(e.text for e in entries)
    entries = re.sub('\s+', ' ', entries)  # mult new-lines

    min_ = int(data.words / 2)
    summary = ml.summarize(entries, min_length=min_, max_length=data.words)
    return {'summary': summary["summary_text"], 'sentiment': summary["sentiment"]}


@app.post('/books/{bid}/{shelf}')
def bookshelf_post(bid, shelf, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.books:
        return cant_snoop('Books')
    M.Bookshelf.upsert(user.id, bid, shelf)
    return {}


@app.get('/books/{shelf}')
def bookshelf_get(
    shelf,
    as_user: str = None,
    viewer: M.User = Depends(fastapi_users.get_current_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.books:
        return cant_snoop('Books')
    return M.Bookshelf.get_shelf(user.id, shelf)


@app.post('/habitica')
def habitica_post(data: M.SIHabitica, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    user.habitica_user_id = data.habitica_user_id
    user.habitica_api_token = data.habitica_api_token
    db.session.commit()
    return {}


@app.post('/habitica/sync')
def habitica_sync_post(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    if not user.habitica_user_id:
        return {}
    habitica.sync_for(user)
    return {}
