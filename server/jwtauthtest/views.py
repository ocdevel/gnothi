import pdb, logging, math, os, re
import datetime
from flask_jwt import jwt_required, current_identity
from jwtauthtest import app
from jwtauthtest.database import db_session, engine
from jwtauthtest.models import User, Entry, Field, FieldEntry, Share, Tag, EntryTag, ShareTag, Person
from jwtauthtest.ec2_updown import ec2_up, ec2_down
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify, g
from jwtauthtest.utils import vars
from jwtauthtest import ml
import requests
from dateutil.parser import parse as dparse

import nltk

nltk.download('punkt')

ec2_up()


def as_user():
    if current_identity:
        g.last_request = datetime.datetime.now()
        ec2_up()
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
    db_session.add(u)
    db_session.commit()
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
    db_session.commit()
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
        db_session.commit()
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
        db_session.commit()
        return jsonify({})
    if request.method == 'DELETE':
        pq.delete()
        db_session.commit()
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
        db_session.commit()
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
        db_session.commit()
        return jsonify({})
    if request.method == 'PUT':
        data = request.get_json()
        for k in ['name', 'selected']:
            if data.get(k): setattr(tag, k, data[k])
        db_session.commit()
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
        db_session.add(s)
    db_session.commit()
    for tag, v in full.items():
        if not v: continue
        db_session.add(ShareTag(share_id=s.id, tag_id=tag, type='full'))
    for tag, v in summary.items():
        if not v: continue
        db_session.add(ShareTag(share_id=s.id, tag_id=tag, type='summary'))
    db_session.commit()
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
        db_session.commit()
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
        db_session.add(entry)
    entry.title = data['title']
    entry.text = data['text']
    # entry needs id, prior tags need deleting
    db_session.commit()
    for tag, v in data['tags'].items():
        if not v: continue
        db_session.add(EntryTag(entry_id=entry.id, tag_id=tag))
    # commit above first, in case run-models crashes
    db_session.commit()

    entry.run_models()
    db_session.commit()

    return jsonify({})


@app.route('/api/entries', methods=['GET', 'POST'])
@jwt_required()
def entries():
    user, snooping = as_user()
    if request.method == 'GET':
        if snooping:
            data = Entry.snoop(current_identity.username, user.id, ['full']).all()
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
        db_session.commit()
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
        db_session.commit()
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
        db_session.commit()
        return jsonify({})
    if request.method == 'DELETE':
        FieldEntry.query.filter_by(user_id=user.id, field_id=field_id).delete()
        Field.query.filter_by(user_id=user.id, id=field_id).delete()
        db_session.commit()
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
    db_session.commit()
    return jsonify({})


@app.route('/api/influencers', methods=['GET'])
@jwt_required()
def influencers():
    user, snooping = as_user()
    if snooping and not user.share_data.fields:
        return cant_snoop('Fields')
    targets, all_imps, next_preds = ml.influencers(
        engine,
        user.id,
        specific_target=request.args.get('target', None),
        logger=app.logger
    )
    data = {'overall': all_imps, 'per_target': targets, 'next_preds': next_preds}
    return jsonify({'data': data})


@app.route('/api/themes', methods=['POST'])
@jwt_required()
def run_themes():
    user, snooping = as_user()
    if snooping and not user.share_data.themes:
        return cant_snoop('Themes')
    data = request.get_json()
    tags = data.get('tags', False)
    entries = Entry.query.filter(Entry.user_id==user.id)
    if tags:
        entries = entries.join(EntryTag, Tag).filter(Tag.id.in_(tags))
    entries = entries.order_by(Entry.created_at.asc())  # build a beginning-to-end story if using BERT
    entries = [e.text for e in entries.all()]

    # For dreams, special handle: process every sentence. TODO make note in UI
    if tags and len(tags) == 1:
        tag_name = Tag.query.get(tags[0]).name
        if re.match('dream(s|ing)?', tag_name, re.IGNORECASE):
            entries = nltk.tokenize.sent_tokenize('. '.join(entries))

    if len(entries) < 10:
        return send_error("Not enough entries to work with, come back later")
    data = ml.themes(entries, with_entries=False)
    if len(data) == 0:
        return send_error("No patterns found in your entries yet, come back later")
    return jsonify({'data': data})


@app.route('/api/books', methods=['POST'])
@jwt_required()
def get_books():
    user, snooping = as_user()
    if snooping and not user.share_data.themes:
        return cant_snoop('Books')
    data = request.get_json()
    tags = data.get('tags', False)
    entries = Entry.query.filter(Entry.user_id == user.id)
    if tags:
        entries = entries.join(EntryTag, Tag).filter(Tag.id.in_(tags))
    entries = [e.text for e in entries.all()]
    if (not snooping) or user.share_data.profile:
        entries = [user.profile_to_text()] + entries

    opts = {
        'metric': request.args.get('metric', 'cosine'),
        'by_cluster': request.args.get('by_cluster', False),
        'by_centroid': request.args.get('by_centroid', False),
        'n_recs': request.args.get('n_recs', 40)
    }

    books = ml.resources(entries, logger=app.logger, **opts)
    return jsonify({'data': books})


@app.route('/api/query', methods=['POST'])
@jwt_required()
def query():
    user, snooping = as_user()
    question = request.get_json()['query']
    if snooping:
        entries = Entry.snoop(current_identity.username, user.id, ['summary', 'full']).all()
    else:
        entries = user.entries
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
    now = datetime.datetime.utcnow()
    days, words = int(data['days']), int(data['words'])
    x_days_ago = now - datetime.timedelta(days=days)

    if snooping:
        entries = Entry.snoop(current_identity.username, user.id, ['summary', 'full'])
    else:
        entries = Entry.query.filter(Entry.user_id == user.id)

    tags = data.get('tags', None)
    if tags:
        entries = entries.join(EntryTag, Tag).filter(Tag.id.in_(tags))

    # order by asc to paint a story from start to finish, since we're summarizing
    entries = entries.filter(Entry.created_at > x_days_ago) \
        .order_by(Entry.created_at.asc()) \
        .all()
    entries = ' '.join(e.text for e in entries)
    entries = re.sub('\s+', ' ', entries)  # mult new-lines

    min_ = int(words / 2)
    summary = ml.summarize(entries, min_length=min_, max_length=words)
    sentiment = ml.sentiment(summary)
    data = {'summary': summary, 'sentiment': sentiment}
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
    db_session.commit()
    return jsonify({})

def sync_habitica_for(user):
    if not (user.habitica_user_id and user.habitica_api_token):
        return
    # https://habitica.com/apidoc/#api-Task-GetUserTasks
    app.logger.info("Calling Habitica")
    headers = {
        "Content-Type": "application/json",
        "x-api-user": user.habitica_user_id,
        "x-api-key": user.habitica_api_token,
        "x-client": f"{vars.HABIT.USER}-{vars.HABIT.APP}"
    }
    tasks = requests.get(
        'https://habitica.com/api/v3/tasks/user',
        headers=headers
    ).json()['data']
    huser = requests.get(
        'https://habitica.com/api/v3/user?userFields=lastCron,needsCron',
        headers=headers
    ).json()['data']

    lastCron = dparse(huser['lastCron'])
    app.logger.info("Habitica finished")

    fes = FieldEntry.get_day_entries(lastCron, user.id).all()

    f_map = {f.service_id: f for f in user.fields}
    fe_map = {fe.field_id: fe for fe in fes}
    t_map = {task['id']: task for task in tasks}

    # Remove Habitica-deleted tasks
    for f in user.fields:
        if f.service != 'habitica': continue
        if f.service_id not in t_map:
            # FIXME change models to cascade deletes, remove line below https://dev.to/zchtodd/sqlalchemy-cascading-deletes-8hk
            FieldEntry.query.filter_by(field_id=f.id).delete()
            db_session.delete(f)

    # Add/update tasks from Habitica
    for task in tasks:
        # {id, text, type, value}
        # habit: {counterUp, counterDown}
        # daily:{checklist: [{completed}], completed, isDue}

        # only care about habits/dailies
        if task['type'] not in ['habit', 'daily']: continue

        f = f_map.get(task['id'], None)
        if not f:
            # Field doesn't exist here yet, add it.
            # TODO delete things here if deleted in habitica
            f = Field(
                service='habitica',
                service_id=task['id'],
                name=task['text'],
                type='number'
            )
            user.fields.append(f)
        # Text has changed on Habitica, update here
        if f.name != task['text']:
            f.name = task['text']

        db_session.commit()  # for f to have f.id

        value = 0.
        # Habit
        if task['type'] == 'habit':
            value = task['counterUp'] - task['counterDown']
        # Daily
        else:
            value = 1. if task['completed'] \
                else 0. if not task['isDue'] \
                else -1.

            # With Checklist
            cl = task['checklist']
            if (not task['completed']) and any(c['completed'] for c in cl):
                value = sum(c['completed'] for c in cl) / len(cl)

        fe = fe_map.get(f.id, None)
        if fe:
            fe.value = value
        else:
            fe = FieldEntry(field_id=f.id, created_at=lastCron, value=value)
            user.field_entries.append(fe)
        db_session.commit()
        app.logger.info(task['text'] + " done")


@app.route('/api/habitica/sync', methods=['POST'])
@jwt_required()
def sync_habitica():
    user, snooping = as_user()
    if snooping: return cant_snoop()
    if not user.habitica_user_id:
        return jsonify({})
    sync_habitica_for(user)
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
                sync_habitica_for(u)
            except Exception as err:
                app.logger.warning(err)


@scheduler.task('cron', id='do_job_ec2', minute="*", misfire_grace_time=900)
def job_ec2():
    with app.app_context():
        diff = datetime.datetime.now() - g.last_request
        if diff.total_seconds() > (60 * 30):  # 30m
            ec2_down()


app.config.from_object(Config())
scheduler.init_app(app)
scheduler.start()
