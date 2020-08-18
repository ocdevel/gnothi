import pdb, re
import datetime
from flask_jwt import jwt_required, current_identity
from app.app_app import app, logger
from app.database import db
import app.models as M
from app import habitica
from app.ec2_updown import jobs_status
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify, g
from app import ml


def as_user():
    # return [as_user, is_snooping]
    as_user = request.args.get('as_user', None)
    if as_user and as_user != current_identity.id:
        user = current_identity.shared_with_me(as_user)
        if user:
            user.share_data = M.Share.query \
                .filter_by(user_id=user.id, email=current_identity.username) \
                .first()
            return user, True
    return current_identity, False


def cant_snoop(feature=None):
    message = f"{feature} isn't shared" if feature else "This feature isn't shared"
    return jsonify({'data': None, 'message': message}), 401


def send_error(message, code=400):
    return jsonify({'ok': False, 'message': message}), code


@app.route('/api/jobs-status', methods=['GET'])
@jwt_required()
def jobs_status_get():
    return jsonify({'data': jobs_status()})


@app.route('/api/user', methods=['GET'])
@jwt_required()
def user_get():
    user, snooping = as_user()
    return jsonify({'data': user.json()})


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    u = M.User(data['username'], pbkdf2_sha256.hash(data['password']))
    u.tags.append(M.Tag(main=True, selected=True, name='Main'))
    db.add(u)
    db.commit()
    return jsonify({})


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile_get():
    user, snooping = as_user()
    if snooping and not user.share_data.profile:
        return cant_snoop()
    return jsonify({'data': user.profile_json()})


@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def profile_put():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    for k, v in data.items():
        if k not in M.User.profile_fields.split(): continue
        v = v or None  # remove empty strings
        setattr(user, k, v)
    db.commit()
    return jsonify({})


@app.route('/api/people', methods=['GET'])
@jwt_required()
def people_get():
    user, snooping = as_user()
    if snooping and not user.share_data.profile:
        return cant_snoop()
    res = [p.json() for p in user.people]
    return jsonify({'data': res})


@app.route('/api/people', methods=['POST'])
@jwt_required()
def people_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    if request.method == 'POST':
        data = request.get_json()
        p = M.Person(**data)
        user.people.append(p)
        db.commit()
        return jsonify({})


def person_q(user_id, person_id):
    # TODO and share_id = ...
    return M.Person.query.filter_by(user_id=user_id, id=person_id)


@app.route('/api/people/<person_id>', methods=['PUT'])
@jwt_required()
def person_put(person_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    pq = person_q(user.id, person_id)
    p = pq.first()
    for k, v in data.items():
        setattr(p, k, v)
    db.commit()
    return jsonify({})


@app.route('/api/people/<person_id>', methods=['DELETE'])
@jwt_required()
def person_delete(person_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    pq = person_q(user.id, person_id)
    pq.delete()
    db.commit()
    return jsonify({})


@app.route('/api/tags', methods=['GET'])
@jwt_required()
def tags_get():
    user, snooping = as_user()
    if snooping:
        data = M.Tag.snoop(current_identity.username, user.id).all()
    else:
        data = user.tags
    data = [j.json() for j in data]
    return jsonify({'data': data})


@app.route('/api/tags', methods=['POST'])
@jwt_required()
def tags_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    user.tags.append(M.Tag(name=data['name']))
    db.commit()
    return jsonify({})


def tag_q(user_id, tag_id):
    tagq = M.Tag.query.filter_by(user_id=user_id, id=tag_id)
    tag = tagq.first()
    return tagq, tag


@app.route('/api/tags/<tag_id>', methods=['PUT'])
@jwt_required()
def tag_put(tag_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    tagq, tag = tag_q(user.id, tag_id)
    data = request.get_json()
    for k in ['name', 'selected']:
        if data.get(k): setattr(tag, k, data[k])
    db.commit()
    return jsonify({})


@app.route('/api/tags/<tag_id>', methods=['DELETE'])
@jwt_required()
def tag_delete(tag_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    tagq, tag = tag_q(user.id, tag_id)
    if tag.main:
        return send_error("Can't delete your main journal")
    # FIXME cascade
    M.EntryTag.query.filter_by(tag_id=tag_id).delete()
    tagq.delete()
    db.commit()
    return jsonify({})


@app.route('/api/shares', methods=['GET'])
@jwt_required()
def shares_get():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    shared = M.Share.query.filter_by(user_id=user.id).all()
    shared = [x.json() for x in shared]
    return jsonify({'data': shared})


def shares_put_post(user, data, share_id=None):
    full = data.pop('full_tags')
    summary = data.pop('summary_tags')
    if share_id:
        s = M.Share.query.filter_by(user_id=user.id, id=share_id).first()
        M.ShareTag.query.filter_by(share_id=s.id).delete()
        for k, v in data.items():
            setattr(s, k, v)
    else:
        s = M.Share(user_id=user.id, **data)
        db.add(s)
    db.commit()
    for tag, v in full.items():
        if not v: continue
        db.add(M.ShareTag(share_id=s.id, tag_id=tag, type='full'))
    for tag, v in summary.items():
        if not v: continue
        db.add(M.ShareTag(share_id=s.id, tag_id=tag, type='summary'))
    db.commit()
    return jsonify({})


@app.route('/api/shares', methods=['POST'])
@jwt_required()
def shares_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    return shares_put_post(user, data)


@app.route('/api/shares/<share_id>', methods=['PUT'])
@jwt_required()
def share_put(share_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    return shares_put_post(user, data, share_id)


@app.route('/api/shares/<share_id>', methods=['DELETE'])
@jwt_required()
def share_delete(share_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    M.ShareTag.query.filter_by(share_id=share_id).delete()
    M.Share.query.filter_by(user_id=user.id, id=share_id).delete()
    db.commit()
    return jsonify({})


def entries_put_post(user, data, entry=None):
    if not any(v for k,v in data['tags'].items()):
        return send_error('Each entry must belong to at least one journal')

    if entry:
        M.EntryTag.query.filter_by(entry_id=entry.id).delete()
    else:
        entry = M.Entry(user_id=user.id)
        db.add(entry)
    entry.title = data['title']
    entry.text = data['text']
    # entry needs id, prior tags need deleting
    db.commit()
    for tag, v in data['tags'].items():
        if not v: continue
        db.add(M.EntryTag(entry_id=entry.id, tag_id=tag))
    # commit above first, in case run-models crashes
    db.commit()

    entry.run_models()
    db.commit()

    return jsonify({})


@app.route('/api/entries', methods=['GET'])
@jwt_required()
def entries_get():
    user, snooping = as_user()
    if snooping:
        data = M.Entry.snoop(current_identity.username, user.id, ['full']) \
            .order_by(M.Entry.created_at.desc())\
            .all()
    else:
        data = user.entries
    data = [e.json() for e in data]
    return jsonify({'data': data})


@app.route('/api/entries', methods=['POST'])
@jwt_required()
def entries_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    return entries_put_post(user, data)


def entry_q(user_id, entry_id, snooper=None):
    if snooper:
        entryq = M.Entry.snoop(snooper, user_id, ['full'])\
            .filter(M.Entry.id==entry_id)
    else:
        entryq = M.Entry.query.filter_by(user_id=user_id, id=entry_id)
    entry = entryq.first()
    return entryq, entry


@app.route('/api/entries/<entry_id>', methods=['GET'])
@jwt_required()
def entry_get(entry_id):
    user, snooping = as_user()
    snooper = snooping and current_identity.username
    entryq, entry = entry_q(user.id, entry_id, snooper)
    return jsonify({'data': entry.json()})


@app.route('/api/entries/<entry_id>', methods=['PUT'])
@jwt_required()
def entry_put(entry_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    entryq, entry = entry_q(user.id, entry_id)
    data = request.get_json()
    return entries_put_post(user, data, entry)


@app.route('/api/entries/<entry_id>', methods=['DELETE'])
@jwt_required()
def entry_delete(entry_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    entryq, entry = entry_q(user.id, entry_id)
    M.EntryTag.query.filter_by(entry_id=entry.id).delete()
    entryq.delete()
    db.commit()
    return jsonify({})


@app.route('/api/fields', methods=['GET'])
@jwt_required()
def fields_get():
    user, snooping = as_user()
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    data = {f.id: f.json() for f in user.fields}
    return jsonify({'data': data})


@app.route('/api/fields', methods=['POST'])
@jwt_required()
def fields_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    f = M.Field(**data)
    user.fields.append(f)
    db.commit()
    return jsonify({})


@app.route('/api/fields/<field_id>', methods=['PUT'])
@jwt_required()
def field_put(field_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    f = M.Field.query.filter_by(user_id=user.id, id=field_id).first()
    data = request.get_json()
    for k, v in data.items():
        setattr(f, k, v)
    db.commit()
    return jsonify({})


@app.route('/api/fields/<field_id>', methods=['DELETE'])
@jwt_required()
def field_delete(field_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    M.FieldEntry.query.filter_by(user_id=user.id, field_id=field_id).delete()
    M.Field.query.filter_by(user_id=user.id, id=field_id).delete()
    db.commit()
    return jsonify({})


@app.route('/api/field-entries', methods=['GET'])
@jwt_required()
def field_entries_get():
    user, snooping = as_user()
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    res = M.FieldEntry.get_today_entries(user.id).all()
    res = {f.field_id: f.value for f in res}
    return jsonify({'data': res})


@app.route('/api/field-entries/<field_id>', methods=['POST'])
@jwt_required()
def field_entries_post(field_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    fe = M.FieldEntry.get_today_entries(user.id, field_id).first()
    v = float(data['value'])
    if fe:
        fe.value = v
    if not fe:
        fe = M.FieldEntry(value=v, field_id=field_id)
        user.field_entries.append(fe)
    db.commit()
    return jsonify({})


@app.route('/api/influencers', methods=['GET'])
@jwt_required()
def influencers_get():
    user, snooping = as_user()
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    targets, all_imps, next_preds = ml.influencers(
        user.id,
        specific_target=request.args.get('target', None),
    )
    data = {'overall': all_imps, 'per_target': targets, 'next_preds': next_preds}
    return jsonify({'data': data})


def limit_days(entries_q):
    days = int(request.get_json()['days'])
    print(days)
    now = datetime.datetime.utcnow()
    x_days = now - datetime.timedelta(days=days)
    # build a beginning-to-end story
    return entries_q.filter(M.Entry.created_at > x_days)\
        .order_by(M.Entry.created_at.asc())


def limit_by_tags(entries_q):
    tags = request.get_json().get('tags', None)
    # no tags selected uses all entries
    if not tags: return entries_q

    joins = [mapper.class_ for mapper in entries_q._join_entities]
    # already joined in Entry.snoop
    if M.EntryTag not in joins:
        entries_q = entries_q.join(M.EntryTag, M.Tag)
    entries_q = entries_q.filter(M.Tag.id.in_(tags))
    return entries_q


@app.route('/api/themes', methods=['POST'])
@jwt_required()
def themes_post():
    user, snooping = as_user()
    if snooping and not user.share_data.themes:
        return cant_snoop('Themes')
    entries = M.Entry.query.filter(M.Entry.user_id==user.id)
    entries = limit_days(entries)
    entries = limit_by_tags(entries)
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
    return jsonify({'data': data})


@app.route('/api/books', methods=['POST'])
@jwt_required()
def books_post():
    user, snooping = as_user()
    if snooping and not user.share_data.themes:
        return cant_snoop('Books')
    # 5725afba: books limited by tag, date. Hard to balance w dnn-predictor, deferring to their thumbs w/o date/tag

    books = ml.books(user)
    return jsonify({'data': books})


@app.route('/api/query', methods=['POST'])
@jwt_required()
def question_post():
    # FIXME not using tags!
    user, snooping = as_user()
    question = request.get_json()['query']
    if snooping:
        entries = M.Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = M.Entry.query.filter(M.Entry.user_id == user.id)
    entries = limit_days(entries)
    entries = limit_by_tags(entries)
    entries = [e.text for e in entries]

    if (not snooping) or user.share_data.profile:
        entries = [user.profile_to_text()] + entries

    res = ml.query(question, entries)
    return jsonify({'data': res})


@app.route('/api/summarize', methods=['POST'])
@jwt_required()
def summarize_post():
    user, snooping = as_user()

    data = request.get_json()
    words = int(data['words'])

    if snooping:
        entries = M.Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = M.Entry.query.filter(M.Entry.user_id == user.id)

    entries = limit_days(entries)
    entries = limit_by_tags(entries)
    entries = ' '.join(e.text for e in entries)
    entries = re.sub('\s+', ' ', entries)  # mult new-lines

    min_ = int(words / 2)
    summary = ml.summarize(entries, min_length=min_, max_length=words)
    data = {'summary': summary["summary_text"], 'sentiment': summary["sentiment"]}
    return jsonify({'data': data})


@app.route('/api/books/<bid>/<shelf>', methods=['POST'])
@jwt_required()
def bookshelf_post(bid, shelf):
    user, snooping = as_user()
    if snooping: return cant_snoop('')
    M.Bookshelf.upsert(user.id, bid, shelf)
    return jsonify({'data': None})


@app.route('/api/books/<shelf>', methods=['GET'])
@jwt_required()
def bookshelf_get(shelf):
    user, snooping = as_user()
    # FIXME handle snooping
    # if snooping: return cant_snoop('')
    data = M.Bookshelf.get_shelf(user.id, shelf)
    return jsonify({'data': data})


@app.route('/api/habitica', methods=['POST'])
@jwt_required()
def habitica_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    user.habitica_user_id = data['habitica_user_id']
    user.habitica_api_token = data['habitica_api_token']
    db.commit()
    return jsonify({})


@app.route('/api/habitica/sync', methods=['POST'])
@jwt_required()
def habitica_sync_post():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    if not user.habitica_user_id:
        return jsonify({})
    habitica.sync_for(user, db)
    return jsonify({})
