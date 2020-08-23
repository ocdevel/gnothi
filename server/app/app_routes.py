import pdb, re, datetime, logging
import dateutil.parser
from typing import List, Dict, Any
from fastapi import Depends, Response, HTTPException
from app.app_app import app
from app.app_jwt import fastapi_users
from fastapi_sqlalchemy import db  # an object to provide global access to a database session
import app.models as M
from app import habitica
from app.ec2_updown import jobs_status
from app import ml
import app.schemas as S
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
def check_pw_post(data: S.FU_UserCreate):
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

 
@app.get('/user', response_model=S.UserOut)
def user_get(as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()  # FIXME not handling this?
    return user


@app.get('/profile', response_model=S.ProfileOut)
def profile_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user


@app.put('/profile/timezone')
def profile_timezone_put(data: S.TimezoneIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    user.timezone = data.timezone
    db.session.commit()
    return {}


@app.put('/profile')
def profile_put(data: S.ProfileIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    for k, v in data.dict().items():
        v = v or None  # remove empty strings
        setattr(user, k, v)
    db.session.commit()
    return {}


@app.get('/people', response_model=List[S.PersonOut])
def people_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return user.people


@app.post('/people')
def people_post(data: S.PersonIn, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    p = M.Person(**data.dict())
    user.people.append(p)
    db.session.commit()
    return {}


@app.put('/people/{person_id}')
def person_put(data: S.PersonIn, person_id: str, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
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


@app.get('/tags', response_model=List[S.TagOut])
def tags_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    return M.Tag.snoop(viewer.email, user.id, snooping=snooping).all()


@app.post('/tags')
def tags_post(data: S.TagIn, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    user.tags.append(M.Tag(name=data.name))
    db.session.commit()
    return {}


@app.put('/tags/{tag_id}')
def tag_put(tag_id, data: S.TagIn, as_user: str = None,  viewer: M.User = Depends(fastapi_users.get_current_user)):
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


@app.get('/shares', response_model=List[S.ShareOut])
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
def shares_post(data: S.ShareIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return shares_put_post(user, data)


@app.put('/shares/{share_id}')
def share_put(share_id, data: S.ShareIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
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


def entries_put_post(user, data: S.EntryIn, entry=None):
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

    entry.run_models()
    db.session.commit()

    return {}


@app.get('/entries', response_model=List[S.EntryOut])
def entries_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    return M.Entry.snoop(viewer.email, user.id, snooping=snooping).all()


@app.post('/entries')
def entries_post(data: S.EntryIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    return entries_put_post(user, data)


@app.get('/entries/{entry_id}', response_model=S.EntryOut)
def entry_get(entry_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    entry = M.Entry.snoop(viewer.email, user.id, snooping=snooping, entry_id=entry_id).first()
    return entry


@app.put('/entries/{entry_id}')
def entry_put(entry_id, data: S.EntryIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    entry = M.Entry.snoop(viewer.email, user.id, entry_id=entry_id).first()
    return entries_put_post(user, data, entry)


@app.delete('/entries/{entry_id}')
def entry_delete(entry_id, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    entryq = M.Entry.snoop(viewer.email, user.id, entry_id=entry_id)
    entryq.delete()
    db.session.commit()
    return {}


@app.get('/fields') #, response_model=S.FieldsOut)
def fields_get(as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    return {f.id: f.json() for f in user.fields}
    # return user.fields


@app.post('/fields')
def fields_post(data: S.Field, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = M.Field(**data.dict())
    user.fields.append(f)
    db.session.commit()
    return {}


@app.put('/fields/{field_id}')
def field_put(field_id, data: S.Field, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    for k, v in data.dict().items():
        setattr(f, k, v)
    db.session.commit()
    return {}

@app.put('/fields/{field_id}/exclude')
def field_put(field_id, data: S.FieldExclude, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping: return cant_snoop()
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    f.excluded_at = data.excluded_at  # just do datetime.now()?
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
def field_entries_post(field_id, data: S.FieldEntry, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
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
    targets, all_imps, next_preds = ml.influencers(
        user.id,
        specific_target=target
    )
    return {'overall': all_imps, 'per_target': targets, 'next_preds': next_preds}


@app.post('/themes')
def themes_post(
    data: S.LimitEntries,
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
    entries = [e.text for e in entries.all()]

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


@app.post('/books')
def books_post(
    as_user: str = None,
    viewer: M.User = Depends(fastapi_users.get_current_user)
):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.books:
        return cant_snoop('Books')

    return ml.books(user)


@app.post('/query')
def question_post(
    data: S.Question,
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
    data: S.Summarize,
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
def bookshelf_get(shelf, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
    user, snooping = getuser(viewer, as_user)
    if snooping and not user.share_data.books:
        return cant_snoop('Books')
    return M.Bookshelf.get_shelf(user.id, shelf)


@app.post('/habitica')
def habitica_post(data: S.HabiticaIn, as_user: str = None, viewer: M.User = Depends(fastapi_users.get_current_user)):
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
