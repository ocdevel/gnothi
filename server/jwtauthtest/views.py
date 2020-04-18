import pdb, logging, math, os, re
import datetime
from flask_jwt import jwt_required, current_identity
from jwtauthtest import app
from jwtauthtest.database import db_session, engine
from jwtauthtest.models import User, Entry, Field, FieldEntry
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify
from jwtauthtest.utils import vars
from jwtauthtest import ml
import requests
from dateutil.parser import parse as dparse


def useradd(username, password):
    db_session.add(User(username, pbkdf2_sha256.hash(password)))
    db_session.commit()


@app.route('/api/check-jwt')
@jwt_required()
def check_jwt():
    return jsonify({'ok': True})


@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    return jsonify(current_identity.json())


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    useradd(data['username'], data['password'])
    return jsonify({'ok': True})


@app.route('/api/entries', methods=['GET', 'POST'])
@jwt_required()
def entries():
    user = current_identity
    if request.method == 'GET':
        return jsonify({'entries': [e.json() for e in user.entries]})
    elif request.method == 'POST':
        data = request.get_json()
        entry = Entry(title=data['title'], text=data['text'])
        entry.run_models()
        user.entries.append(entry)
        db_session.commit()
        return jsonify({'ok': True})


@app.route('/api/entries/<entry_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def entry(entry_id):
    user = current_identity
    entry = Entry.query.filter_by(user_id=user.id, id=entry_id)
    if request.method == 'GET':
        return jsonify(entry.first().json())
    if request.method == 'PUT':
        data = request.get_json()
        entry = entry.first()
        entry.title = data['title']
        entry.text = data['text']
        entry.run_models()
        db_session.commit()
        return jsonify({'ok': True})
    if request.method == 'DELETE':
        entry.delete()
        db_session.commit()
        return jsonify({'ok': True})


@app.route('/api/fields', methods=['GET', 'POST'])
@jwt_required()
def fields():
    user = current_identity
    if request.method == 'GET':
        return jsonify({f.id: f.json() for f in user.fields})
    if request.method == 'POST':
        data = request.get_json()
        f = Field(**data)
        user.fields.append(f)
        db_session.commit()
        return jsonify({'ok': True})


@app.route('/api/fields/<field_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def field(field_id):
    user = current_identity
    if request.method == 'PUT':
        f = Field.query.filter_by(user_id=user.id, id=field_id).first()
        data = request.get_json()
        for k, v in data.items():
            setattr(f, k, v)
        db_session.commit()
        return jsonify({'ok': True})
    if request.method == 'DELETE':
        FieldEntry.query.filter_by(user_id=user.id, field_id=field_id).delete()
        Field.query.filter_by(user_id=user.id, id=field_id).delete()
        db_session.commit()
        return jsonify({'ok': True})


@app.route('/api/field-entries')
@jwt_required()
def field_entries():
    res = FieldEntry.get_today_entries(current_identity.id).all()
    res = {f.field_id: f.value for f in res}
    return jsonify(res)


@app.route('/api/field-entries/<field_id>', methods=['POST'])
@jwt_required()
def field_entry(field_id):
    user = current_identity
    data = request.get_json()
    fe = FieldEntry.get_today_entries(user.id, field_id).first()
    v = float(data['value'])
    if fe:
        fe.value = v
    if not fe:
        fe = FieldEntry(value=v, field_id=field_id)
        user.field_entries.append(fe)
    db_session.commit()
    return jsonify({'ok': True})


@app.route('/api/habitica', methods=['POST'])
@jwt_required()
def setup_habitica():
    user = current_identity
    data = request.get_json()
    user.habitica_user_id = data['habitica_user_id']
    user.habitica_api_token = data['habitica_api_token']
    db_session.commit()
    return jsonify({'ok': True})


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
    user = current_identity
    if not user.habitica_user_id:
        return jsonify({'ok': False})
    sync_habitica_for(user)
    return jsonify({'ok': True})


@app.route('/api/influencers', methods=['GET'])
@jwt_required()
def influencers():
    targets, all_imps = ml.influencers(
        engine,
        current_identity.id,
        specific_target=request.args.get('target', None),
        logger=app.logger
    )
    return jsonify({'overall': all_imps, 'per_target': targets})


@app.route('/api/gensim', methods=['GET'])
@jwt_required()
def run_gensim():
    advanced = request.args.get('advanced', False)
    entries = [e.text for e in current_identity.entries]
    return jsonify(ml.themes(entries, advanced=advanced))


@app.route('/api/books', methods=['GET'])
@jwt_required()
def get_books():
    entries = [e.text for e in current_identity.entries]
    books = ml.resources(entries, logger=app.logger)
    return jsonify(books)


@app.route('/api/query', methods=['POST'])
@jwt_required()
def query():
    question = request.get_json()['query']
    entries = [e.text for e in current_identity.entries]
    res = ml.query(question, entries)
    return jsonify(res)

@app.route('/api/summarize', methods=['POST'])
@jwt_required()
def summarize():
    data = request.get_json()
    now = datetime.datetime.utcnow()
    days, words = int(data['days']), int(data['words'])*5
    x_days_ago = now - datetime.timedelta(days=days)

    # order by asc to paint a story from start to finish, since we're summarizing
    entries = Entry.query.filter(
            Entry.user_id==current_identity.id,
            Entry.created_at > x_days_ago
        )\
        .order_by(Entry.created_at.asc())\
        .all()
    entries = ' '.join(e.text for e in entries)
    entries = re.sub('\s+', ' ', entries)  # mult new-lines
    min_ = int(words*2/3)
    res = ml.summarize(entries, min_, words)
    return jsonify({'summary': res})


# https://github.com/viniciuschiele/flask-apscheduler/blob/master/examples/jobs.py
from flask_apscheduler import APScheduler
class Config(object):
    SCHEDULER_API_ENABLED = True
scheduler = APScheduler()
# interval examples
@scheduler.task('interval', id='do_job_1', seconds=60*60, misfire_grace_time=900)
def job1():
    with app.app_context():
        print("Running cron")
        q = User.query.filter(User.habitica_user_id != None, User.habitica_user_id != '')
        for u in q.all():
            sync_habitica_for(u)

app.config.from_object(Config())
scheduler.init_app(app)
scheduler.start()
