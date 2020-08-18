import pdb, re
import datetime
from fastapi import Depends, Response
from app.app_app import app, logger
from app.app_jwt import manager
from fastapi_sqlalchemy import db  # an object to provide global access to a database session
import app.models as M
from app import habitica
from app.ec2_updown import jobs_status
from passlib.hash import pbkdf2_sha256
from app import ml
import app.schemas as S
from sqlalchemy.orm import Session


def as_user_(current_identity: M.User, as_user: str):
    if as_user and as_user != current_identity.id:
        user = current_identity.shared_with_me(as_user)
        if user:
            user.share_data = db.session.query(M.Share)\
                .filter_by(user_id=user.id, email=current_identity.username)\
                .first()
            return user, True
    return current_identity, False


def cant_snoop(response: Response, feature=None):
    message = f"{feature} isn't shared" if feature else "This feature isn't shared"
    response.status_code = 401
    return {'data': None, 'message': message}


def send_error(response: Response, message, code: int = 400):
    response.status_code = code
    return {'ok': False, 'message': message}


@app.get('/jobs-status')
def jobs_status_get(current_identity=Depends(manager)):
    return {'data': jobs_status()}

 
@app.get('/user')
def user_get(response: Response, as_user: str = None,  current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)  # FIXME not handling this?
    return {'data': user.json()}


@app.post('/register')
def register_post(data: S.Reg):
    u = M.User(data.username, pbkdf2_sha256.hash(data.password))
    u.tags.append(M.Tag(main=True, selected=True, name='Main'))
    db.session.add(u)
    db.session.commit()
    return {}


@app.get('/profile')
def profile_get(response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop(response)
    return {'data': user.profile_json()}


@app.put('/profile/timezone')
def profile_timezone_put(data: S.ProfileTimezone, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    user.timezone = data.timezone
    db.session.commit()
    return {}


@app.put('/profile')
def profile_put(data: S.Profile, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    for k, v in data.dict().items():
        if k not in M.User.profile_fields.split(): continue
        v = v or None  # remove empty strings
        setattr(user, k, v)
    db.session.commit()
    return {}


@app.get('/people')
def people_get(response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.profile:
        return cant_snoop(response)
    res = [p.json() for p in user.people]
    return {'data': res}


@app.post('/people')
def people_post(data: S.Person, response: Response, as_user: str = None,  current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    p = M.Person(**data.dict())
    user.people.append(p)
    db.session.commit()
    return {}


def person_q(user_id, person_id):
    # TODO and share_id = ...
    return db.session.query(M.Person).filter_by(user_id=user_id, id=person_id)


@app.put('/people/{person_id}')
def person_put(data: S.Person, person_id: str, response: Response, as_user: str = None,  current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    pq = person_q(user.id, person_id)
    p = pq.first()
    for k, v in data.dict().items():
        setattr(p, k, v)
    db.session.commit()
    return {}


@app.delete('/people/{person_id}')
def person_delete(person_id: str, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    pq = person_q(user.id, person_id)
    pq.delete()
    db.session.commit()
    return {}


@app.get('/tags')
def tags_get(as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping:
        data = M.Tag.snoop(current_identity.username, user.id).all()
    else:
        data = user.tags
    data = [j.json() for j in data]
    return {'data': data}


@app.post('/tags')
def tags_post(data: S.Tag, response: Response, as_user: str = None,  current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    user.tags.append(M.Tag(name=data.name))
    db.session.commit()
    return {}


def tag_q(user_id, tag_id):
    tagq = db.session.query(M.Tag).filter_by(user_id=user_id, id=tag_id)
    tag = tagq.first()
    return tagq, tag


@app.put('/tags/{tag_id}')
def tag_put(tag_id, data: S.Tag, response: Response, as_user: str = None,  current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    tagq, tag = tag_q(user.id, tag_id)
    data = data.dict()
    for k in ['name', 'selected']:
        if data.get(k): setattr(tag, k, data[k])
    db.session.commit()
    return {}


@app.delete('/tags/{tag_id}')
def tag_delete(tag_id, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    tagq, tag = tag_q(user.id, tag_id)
    if tag.main:
        return send_error("Can't delete your main journal")
    # FIXME cascade
    db.session.query(M.EntryTag).filter_by(tag_id=tag_id).delete()
    tagq.delete()
    db.session.commit()
    return {}


@app.get('/shares')
def shares_get(response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    shared = db.session.query(M.Share).filter_by(user_id=user.id).all()
    shared = [x.json() for x in shared]
    return {'data': shared}


def shares_put_post(user, data, share_id=None):
    data = data.dict()
    full = data.pop('full_tags')
    summary = data.pop('summary_tags')
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
    for tag, v in full.items():
        if not v: continue
        db.session.add(M.ShareTag(share_id=s.id, tag_id=tag, type='full'))
    for tag, v in summary.items():
        if not v: continue
        db.session.add(M.ShareTag(share_id=s.id, tag_id=tag, type='summary'))
    db.session.commit()
    return {}


@app.post('/shares')
def shares_post(data: S.Share, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    return shares_put_post(user, data)


@app.put('/shares/{share_id}')
def share_put(share_id, data: S.Share, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    return shares_put_post(user, data, share_id)


@app.delete('/shares/{share_id}')
def share_delete(share_id, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    db.session.query(M.ShareTag).filter_by(share_id=share_id).delete()
    db.session.query(M.Share).filter_by(user_id=user.id, id=share_id).delete()
    db.session.commit()
    return {}


def entries_put_post(user, data: S.Entry, entry=None):
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


@app.get('/entries')
def entries_get(as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping:
        data = M.Entry.snoop(current_identity.username, user.id, ['full']) \
            .order_by(M.Entry.created_at.desc())\
            .all()
    else:
        data = user.entries
    data = [e.json() for e in data]
    return {'data': data}


@app.post('/entries')
def entries_post(data: S.Entry, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    return entries_put_post(user, data)


def entry_q(user_id, entry_id, snooper=None):
    if snooper:
        entryq = M.Entry.snoop(snooper, user_id, ['full'])\
            .filter(M.Entry.id==entry_id)
    else:
        entryq = db.session.query(M.Entry).filter_by(user_id=user_id, id=entry_id)
    entry = entryq.first()
    return entryq, entry


@app.get('/entries/{entry_id}')
def entry_get(entry_id, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    snooper = snooping and current_identity.username
    entryq, entry = entry_q(user.id, entry_id, snooper)
    return {'data': entry.json()}


@app.put('/entries/{entry_id}')
def entry_put(entry_id, data: S.Entry, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    entryq, entry = entry_q(user.id, entry_id)
    return entries_put_post(user, data, entry)


@app.delete('/entries/{entry_id}')
def entry_delete(entry_id, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    entryq, entry = entry_q(user.id, entry_id)
    db.session.query(M.EntryTag).filter_by(entry_id=entry.id).delete()
    entryq.delete()
    db.session.commit()
    return {}


@app.get('/fields')
def fields_get(response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop(response, 'Fields')
    data = {f.id: f.json() for f in user.fields}
    return {'data': data}


@app.post('/fields')
def fields_post(data: S.Field, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    f = M.Field(**data.dict())
    user.fields.append(f)
    db.session.commit()
    return {}


@app.put('/fields/{field_id}')
def field_put(field_id, data: S.Field, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    for k, v in data.dict().items():
        setattr(f, k, v)
    db.session.commit()
    return {}

@app.put('/fields/{field_id}/exclude')
def field_put(field_id, data: S.FieldExclude, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    f = db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).first()
    f.excluded_at = data.excluded_at  # just do datetime.now()?
    db.session.commit()
    return {}


@app.delete('/fields/{field_id}')
def field_delete(field_id, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    db.session.query(M.FieldEntry).filter_by(user_id=user.id, field_id=field_id).delete()
    db.session.query(M.Field).filter_by(user_id=user.id, id=field_id).delete()
    db.session.commit()
    return {}


@app.get('/field-entries')
def field_entries_get(response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop(response, 'Fields')
    res = M.FieldEntry.get_today_entries(user.id).all()
    res = {f.field_id: f.value for f in res}
    return {'data': res}


@app.post('/field-entries/{field_id}')
def field_entries_post(field_id, data: S.FieldEntry, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
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
    response: Response,
    target: str = None,
    as_user: str = None,
    current_identity=Depends(manager)
):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.fields:
        return cant_snoop(response, 'Fields')
    targets, all_imps, next_preds = ml.influencers(
        user.id,
        specific_target=target
    )
    data = {'overall': all_imps, 'per_target': targets, 'next_preds': next_preds}
    return {'data': data}


def limit_days(entries_q, days: int):
    now = datetime.datetime.utcnow()
    x_days = now - datetime.timedelta(days=days)
    # build a beginning-to-end story
    return entries_q.filter(M.Entry.created_at > x_days)\
        .order_by(M.Entry.created_at.asc())


def limit_by_tags(entries_q, tags=None):
    # no tags selected uses all entries
    if not tags: return entries_q

    joins = [mapper.class_ for mapper in entries_q._join_entities]
    # already joined in Entry.snoop
    if M.EntryTag not in joins:
        entries_q = entries_q.join(M.EntryTag, M.Tag)
    entries_q = entries_q.filter(M.Tag.id.in_(tags))
    return entries_q


@app.post('/themes')
def themes_post(
    data: S.LimitEntries,
    response: Response,
    as_user: str = None,
    current_identity=Depends(manager)
):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.themes:
        return cant_snoop(response, 'Themes')
    entries = db.session.query(M.Entry).filter(M.Entry.user_id==user.id)
    entries = limit_days(entries, data.days)
    entries = limit_by_tags(entries, data.tags)
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
    return {'data': data}


@app.post('/books')
def books_post(
    response: Response,
    as_user: str = None,
    current_identity=Depends(manager)
):
    user, snooping = as_user_(current_identity, as_user)
    if snooping and not user.share_data.themes:
        return cant_snoop(response, 'Books')
    # 5725afba: books limited by tag, date. Hard to balance w dnn-predictor, deferring to their thumbs w/o date/tag

    books = ml.books(user)
    return {'data': books}


@app.post('/query')
def question_post(
    data: S.Question,
    response: Response,
    as_user: str = None,
    current_identity=Depends(manager)
):
    user, snooping = as_user_(current_identity, as_user)
    question = data.query
    if snooping:
        entries = M.Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = db.session.query(M.Entry).filter(M.Entry.user_id == user.id)
    entries = limit_days(entries, data.days)
    entries = limit_by_tags(entries, data.tags)
    entries = [e.text for e in entries]

    if (not snooping) or user.share_data.profile:
        entries = [user.profile_to_text()] + entries

    res = ml.query(question, entries)
    return {'data': res}


@app.post('/summarize')
def summarize_post(
    data: S.Summarize,
    as_user: str = None,
    current_identity=Depends(manager)
):
    user, snooping = as_user_(current_identity, as_user)
    if snooping:
        entries = M.Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = db.session.query(M.Entry).filter(M.Entry.user_id == user.id)

    words = int(data.words)
    entries = limit_days(entries, data.days)
    entries = limit_by_tags(entries, data.tags)
    entries = ' '.join(e.text for e in entries)
    entries = re.sub('\s+', ' ', entries)  # mult new-lines

    min_ = int(words / 2)
    summary = ml.summarize(entries, min_length=min_, max_length=words)
    data = {'summary': summary["summary_text"], 'sentiment': summary["sentiment"]}
    return {'data': data}


@app.post('/books/{bid}/{shelf}')
def bookshelf_post(bid, shelf, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    M.Bookshelf.upsert(user.id, bid, shelf)
    return {'data': None}


@app.get('/books/{shelf}')
def bookshelf_get(shelf, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    # FIXME handle snooping
    # if snooping: return cant_snoop('')
    data = M.Bookshelf.get_shelf(user.id, shelf)
    return {'data': data}


@app.post('/habitica')
def habitica_post(data: S.ProfileHabitica, response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    user.habitica_user_id = data.habitica_user_id
    user.habitica_api_token = data.habitica_api_token
    db.session.commit()
    return {}


@app.post('/habitica/sync')
def habitica_sync_post(response: Response, as_user: str = None, current_identity=Depends(manager)):
    user, snooping = as_user_(current_identity, as_user)
    if snooping: return cant_snoop(response)
    if not user.habitica_user_id:
        return {}
    habitica.sync_for(user)
    return {}
