import pdb, logging, math, os, re
import datetime
import app.jwt_setup
from flask_jwt import jwt_required, current_identity
from app import app
from app.database import db
from app.models import User, Entry, Field, FieldEntry, Share, Tag, EntryTag, ShareTag, Person, Bookshelf
from app.habitica import sync_habitica_for
from app.ec2_updown import jobs_status, ec2_down_maybe
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify, g
from app import ml



def as_user():
    # return [as_user, is_snooping]
    as_user = request.args.get('as', None)
    if as_user and as_user != current_identity.id:
        user = current_identity.shared_with_me(as_user)
        if user:
            user.share_data = Share.query \
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
def jobs_status_route():
    return jsonify({'data': jobs_status()})

@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    user, snooping = as_user()
    return jsonify({'data': user.json()})


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    u = User(data['username'], pbkdf2_sha256.hash(data['password']))
    u.tags.append(Tag(main=True, selected=True, name='Main'))
    db.add(u)
    db.commit()
    return jsonify({})


@app.route('/api/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user, snooping = as_user()
    if snooping and not user.share_data.profile:
        return cant_snoop()
    if request.method == 'GET':
        return jsonify({'data': user.profile_json()})

    if snooping: return cant_snoop()
    data = request.get_json()
    for k, v in data.items():
        if k not in User.profile_fields.split(): continue
        v = v or None  # remove empty strings
        setattr(user, k, v)
    db.commit()
    return jsonify({})


@app.route('/api/people', methods=['GET', 'POST'])
@jwt_required()
def people():
    user, snooping = as_user()
    if request.method == 'GET':
        if snooping and not user.share_data.profile:
            return cant_snoop()
        res = [p.json() for p in user.people]
        return jsonify({'data': res})

    if snooping: return cant_snoop()
    if request.method == 'POST':
        data = request.get_json()
        p = Person(**data)
        user.people.append(p)
        db.commit()
        return jsonify({})


@app.route('/api/people/<person_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def person(person_id):
    user, snooping = as_user()
    if snooping: return cant_snoop()

    # TODO and share_id = ...
    pq = Person.query.filter_by(user_id=user.id, id=person_id)
    p = pq.first()
    if request.method == 'PUT':
        data = request.get_json()
        for k, v in data.items():
            setattr(p, k, v)
        db.commit()
        return jsonify({})
    if request.method == 'DELETE':
        pq.delete()
        db.commit()
        return jsonify({})

@app.route('/api/tags', methods=['GET', 'POST'])
@jwt_required()
def tags():
    user, snooping = as_user()
    if request.method == 'GET':
        if snooping:
            data = Tag.snoop(current_identity.username, user.id).all()
        else:
            data = user.tags
        data = [j.json() for j in data]
        return jsonify({'data': data})

    if snooping: return cant_snoop()
    if request.method == 'POST':
        data = request.get_json()
        user.tags.append(Tag(name=data['name']))
        db.commit()
        return jsonify({})


@app.route('/api/tags/<tag_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def tag(tag_id):
    user, snooping = as_user()

    if snooping: return cant_snoop()
    tagq = Tag.query.filter_by(user_id=user.id, id=tag_id)
    tag = tagq.first()
    if request.method == 'DELETE':
        if tag.main:
            return send_error("Can't delete your main journal")
        # FIXME cascade
        EntryTag.query.filter_by(tag_id=tag_id).delete()
        tagq.delete()
        db.commit()
        return jsonify({})
    if request.method == 'PUT':
        data = request.get_json()
        for k in ['name', 'selected']:
            if data.get(k): setattr(tag, k, data[k])
        db.commit()
        return jsonify({})


def shares_put_post(user, share_id=None):
    data = request.get_json()
    full = data.pop('full_tags')
    summary = data.pop('summary_tags')
    if share_id:
        s = Share.query.filter_by(user_id=user.id, id=share_id).first()
        ShareTag.query.filter_by(share_id=s.id).delete()
        for k, v in data.items():
            setattr(s, k, v)
    else:
        s = Share(user_id=user.id, **data)
        db.add(s)
    db.commit()
    for tag, v in full.items():
        if not v: continue
        db.add(ShareTag(share_id=s.id, tag_id=tag, type='full'))
    for tag, v in summary.items():
        if not v: continue
        db.add(ShareTag(share_id=s.id, tag_id=tag, type='summary'))
    db.commit()
    return jsonify({})


@app.route('/api/shares', methods=['GET', 'POST'])
@jwt_required()
def shares():
    user, snooping = as_user()

    if snooping: return cant_snoop()
    if request.method == 'GET':
        shared = Share.query.filter_by(user_id=user.id).all()
        shared = [x.json() for x in shared]
        return jsonify({'data': shared})
    if request.method == 'POST':
        return shares_put_post(user)


@app.route('/api/shares/<share_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def share(share_id):
    user, snooping = as_user()

    if snooping: return cant_snoop()
    if request.method == 'DELETE':
        ShareTag.query.filter_by(share_id=share_id).delete()
        Share.query.filter_by(user_id=user.id, id=share_id).delete()
        db.commit()
        return jsonify({})
    if request.method == 'PUT':
        return shares_put_post(user, share_id)


def entries_put_post(user, entry=None):
    data = request.get_json()
    if not any(v for k,v in data['tags'].items()):
        return send_error('Each entry must belong to at least one journal')

    if entry:
        EntryTag.query.filter_by(entry_id=entry.id).delete()
    else:
        entry = Entry(user_id=user.id)
        db.add(entry)
    entry.title = data['title']
    entry.text = data['text']
    # entry needs id, prior tags need deleting
    db.commit()
    for tag, v in data['tags'].items():
        if not v: continue
        db.add(EntryTag(entry_id=entry.id, tag_id=tag))
    # commit above first, in case run-models crashes
    db.commit()

    entry.run_models()
    db.commit()

    return jsonify({})


@app.route('/api/entries', methods=['GET', 'POST'])
@jwt_required()
def entries():
    user, snooping = as_user()
    if request.method == 'GET':
        if snooping:
            data = Entry.snoop(current_identity.username, user.id, ['full']) \
                .order_by(Entry.created_at.desc())\
                .all()
        else:
            data = user.entries
        data = [e.json() for e in data]
        return jsonify({'data': data})

    if snooping: return cant_snoop()
    if request.method == 'POST':
        return entries_put_post(user)


@app.route('/api/entries/<entry_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def entry(entry_id):
    user, snooping = as_user()

    if snooping:
        entryq = Entry.snoop(current_identity.username, user.id, ['full'])\
            .filter(Entry.id==entry_id)
    else:
        entryq = Entry.query.filter_by(user_id=user.id, id=entry_id)
    entry = entryq.first()

    if request.method == 'GET':
        return jsonify({'data': entry.json()})

    if snooping: return cant_snoop()
    if request.method == 'PUT':
        return entries_put_post(user, entry)
    if request.method == 'DELETE':
        EntryTag.query.filter_by(entry_id=entry.id).delete()
        entryq.delete()
        db.commit()
        return jsonify({})


@app.route('/api/fields', methods=['GET', 'POST'])
@jwt_required()
def fields():
    user, snooping = as_user()
    if request.method == 'GET':
        if snooping and not user.share_data.fields:
            return cant_snoop('Fields')
        data = {f.id: f.json() for f in user.fields}
        return jsonify({'data': data})

    if snooping: return cant_snoop()
    if request.method == 'POST':
        data = request.get_json()
        f = Field(**data)
        user.fields.append(f)
        db.commit()
        return jsonify({})


@app.route('/api/fields/<field_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def field(field_id):
    user, snooping = as_user()

    if snooping: return cant_snoop()
    if request.method == 'PUT':
        f = Field.query.filter_by(user_id=user.id, id=field_id).first()
        data = request.get_json()
        for k, v in data.items():
            setattr(f, k, v)
        db.commit()
        return jsonify({})
    if request.method == 'DELETE':
        FieldEntry.query.filter_by(user_id=user.id, field_id=field_id).delete()
        Field.query.filter_by(user_id=user.id, id=field_id).delete()
        db.commit()
        return jsonify({})


@app.route('/api/field-entries')
@jwt_required()
def field_entries():
    user, snooping = as_user()
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    res = FieldEntry.get_today_entries(user.id).all()
    res = {f.field_id: f.value for f in res}
    return jsonify({'data': res})


@app.route('/api/field-entries/<field_id>', methods=['POST'])
@jwt_required()
def field_entry(field_id):
    user, snooping = as_user()

    if snooping: return cant_snoop()
    data = request.get_json()
    fe = FieldEntry.get_today_entries(user.id, field_id).first()
    v = float(data['value'])
    if fe:
        fe.value = v
    if not fe:
        fe = FieldEntry(value=v, field_id=field_id)
        user.field_entries.append(fe)
    db.commit()
    return jsonify({})


@app.route('/api/influencers', methods=['GET'])
@jwt_required()
def influencers():
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
    return entries_q.filter(Entry.created_at > x_days)\
        .order_by(Entry.created_at.asc())

def limit_by_tags(entries_q):
    tags = request.get_json().get('tags', None)
    # no tags selected uses all entries
    if not tags: return entries_q

    joins = [mapper.class_ for mapper in entries_q._join_entities]
    # already joined in Entry.snoop
    if EntryTag not in joins:
        entries_q = entries_q.join(EntryTag, Tag)
    entries_q = entries_q.filter(Tag.id.in_(tags))
    return entries_q


@app.route('/api/themes', methods=['POST'])
@jwt_required()
def run_themes():
    user, snooping = as_user()
    if snooping and not user.share_data.themes:
        return cant_snoop('Themes')
    entries = Entry.query.filter(Entry.user_id==user.id)
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
def get_books():
    user, snooping = as_user()
    if snooping and not user.share_data.themes:
        return cant_snoop('Books')
    # 5725afba: books limited by tag, date. Hard to balance w dnn-predictor, deferring to their thumbs w/o date/tag

    books = ml.books(user)
    return jsonify({'data': books})


@app.route('/api/query', methods=['POST'])
@jwt_required()
def query():
    # FIXME not using tags!
    user, snooping = as_user()
    question = request.get_json()['query']
    if snooping:
        entries = Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = Entry.query.filter(Entry.user_id == user.id)
    entries = limit_days(entries)
    entries = limit_by_tags(entries)
    entries = [e.text for e in entries]

    if (not snooping) or user.share_data.profile:
        entries = [user.profile_to_text()] + entries

    res = ml.query(question, entries)
    return jsonify({'data': res})


@app.route('/api/summarize', methods=['POST'])
@jwt_required()
def summarize():
    user, snooping = as_user()

    data = request.get_json()
    words = int(data['words'])

    if snooping:
        entries = Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = Entry.query.filter(Entry.user_id == user.id)

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
def shelf_book(bid, shelf):
    user, snooping = as_user()
    if snooping: return cant_snoop('')
    Bookshelf.upsert(user.id, bid, shelf)
    return jsonify({'data': None})


@app.route('/api/books/<shelf>', methods=['GET'])
@jwt_required()
def get_shelf(shelf):
    user, snooping = as_user()
    # FIXME handle snooping
    # if snooping: return cant_snoop('')
    data = Bookshelf.get_shelf(user.id, shelf)
    return jsonify({'data': data})


####
# Habitica
####


@app.route('/api/habitica', methods=['POST'])
@jwt_required()
def setup_habitica():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    data = request.get_json()
    user.habitica_user_id = data['habitica_user_id']
    user.habitica_api_token = data['habitica_api_token']
    db.commit()
    return jsonify({})


@app.route('/api/habitica/sync', methods=['POST'])
@jwt_required()
def sync_habitica():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    if not user.habitica_user_id:
        return jsonify({})
    sync_habitica_for(user, db)
    return jsonify({})


# https://github.com/viniciuschiele/flask-apscheduler/blob/master/examples/jobs.py
from flask_apscheduler import APScheduler
class Config(object):
    SCHEDULER_API_ENABLED = True
scheduler = APScheduler()


@scheduler.task('cron', id='do_job_habitica', hour="*", misfire_grace_time=900)
def job_habitica():
    with app.app_context():
        app.logger.info("Running cron")
        q = User.query.filter(User.habitica_user_id != None, User.habitica_user_id != '')
        for u in q.all():
            try:
                sync_habitica_for(u, db)
            except Exception as err:
                app.logger.warning(err)


@scheduler.task('cron', id='do_job_ec2', minute="*", misfire_grace_time=900)
def job_ec2():
    ec2_down_maybe()


app.config.from_object(Config())
scheduler.init_app(app)
scheduler.start()

if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host='0.0.0.0', debug=True)
