import pdb, logging, math
from flask_jwt import jwt_required, current_identity
from jwtauthtest import app
from jwtauthtest.database import db_session, engine
from jwtauthtest.models import User, Entry, Field, FieldEntry
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify
from jwtauthtest.utils import vars
import requests
from dateutil.parser import parse as dparse

from xgboost import XGBRegressor
import pandas as pd
import numpy as np


def useradd(username, password):
    db_session.add(User(username, pbkdf2_sha256.hash(password)))
    db_session.commit()


@app.route('/check-jwt')
@jwt_required()
def check_jwt():
    return jsonify({'ok': True})


@app.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    return jsonify(current_identity.json())


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    useradd(data['username'], data['password'])
    return jsonify({'ok': True})


@app.route('/entries', methods=['GET', 'POST'])
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


@app.route('/entries/<entry_id>', methods=['GET', 'PUT', 'DELETE'])
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


@app.route('/fields', methods=['GET', 'POST'])
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


@app.route('/fields/<field_id>', methods=['PUT', 'DELETE'])
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


@app.route('/field-entries')
@jwt_required()
def field_entries():
    res = FieldEntry.get_today_entries(current_identity.id).all()
    res = {f.field_id: f.value for f in res}
    return jsonify(res)


@app.route('/field-entries/<field_id>', methods=['POST'])
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


@app.route('/habitica', methods=['POST'])
@jwt_required()
def setup_habitica():
    user = current_identity
    data = request.get_json()
    user.habitica_user_id = data['habitica_user_id']
    user.habitica_api_token = data['habitica_api_token']
    db_session.commit()
    return jsonify({'ok': True})


def sync_habitica_for(user):
    if not user.habitica_user_id:
        return jsonify({'ok': False})

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
            fe = FieldEntry(field_id=f.id, created_at=lastCron)
            user.field_entries.append(fe)
        db_session.commit()
        app.logger.info(task['text'] + " done")

    return jsonify({'ok': True})


@app.route('/habitica/sync', methods=['POST'])
@jwt_required()
def sync_habitica():
    sync_habitica_for(current_identity)
    return jsonify({'ok': True})


@app.route('/influencers', methods=['GET'])
@jwt_required()
def influencers():
    user = current_identity
    with engine.connect() as conn:
        fes = pd.read_sql("""
        select  
            fe.created_at::date, -- index 
            fe.field_id, -- column
            fe.value -- value
        from field_entries fe
        inner join fields f on f.id=fe.field_id
        where fe.user_id=%(user_id)s
            -- exclude these to improve model perf
            -- TODO reconsider for past data
            and f.excluded_at is null
        order by fe.created_at asc
        """, conn, params={'user_id': user.id})
        # uuid as string
        fes['field_id'] = fes.field_id.apply(str)

        fs = pd.read_sql("""
        select id, target, default_value, default_value_value
        from fields
        where user_id=%(user_id)s
        """, conn, params={'user_id': user.id})
        fs['id'] = fs.id.apply(str)

    target_ids = fs[fs.target == True].id.values
    fs = {str(r.id): r for i, r in fs.iterrows()}

    # Easier pivot debugging
    # fields['field_id'] =  fields.field_id.apply(lambda x: x[0:4])
    fes = fes.pivot(index='created_at', columns='field_id', values='value')

    # fes = fes.resample('D')
    cols = fes.columns.tolist()

    # TODO resample on Days
    for fid in fes.columns:
        dv = fs[fid].default_value
        dvv = fs[fid].default_value_value
        if not dv: continue
        if dv == 'value':
            if not dvv: continue
            fes[fid] = fes[fid].fillna(dvv)
        elif dv == 'ffill':
            fes[fid] = fes[fid].fillna(method='ffill')\
                .fillna(method='bfill')
        elif dv == 'average':
            fes[fid] = fes[fid].fillna(fes[fid].mean())

    specific_target = request.args.get('target', None)
    targets = {}
    all_imps = []
    for target in target_ids:
        if specific_target and specific_target != target:
            continue
        X = fes.drop(columns=[target])
        y = fes[target]
        model = XGBRegressor()
        # This part is important. Rather than say "what today predicts y" (not useful),
        # or even "what history predicts y" (would be time-series models, which don't have feature_importances_)
        # we can approximate it a rolling average of activity.
        # TODO not sure which window fn to use: rolling|expanding|ewm?
        # https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.rolling.html
        # http://people.duke.edu/~ccc14/bios-823-2018/S18A_Time_Series_Manipulation_Smoothing.html#Window-functions
        mult_day_avg = X.ewm(span=5).mean()
        model.fit(mult_day_avg, y)
        imps = [float(x) for x in model.feature_importances_]

        # FIXME
        # /xgboost/sklearn.py:695: RuntimeWarning: invalid value encountered in true_divide return all_features / all_features.sum()
        # I think this is due to target having no different value, in which case
        # just leave like this.
        imps = [0. if np.isnan(imp) else imp for imp in imps]

        # put target col back in
        imps.insert(cols.index(target), 0.0)
        dict_ = dict(zip(cols, imps))
        all_imps.append(dict_)
        targets[target] = dict_
    all_imps = dict(pd.DataFrame(all_imps).mean())
    return jsonify({'overall': all_imps, 'per_target': targets})

from gensim.utils import simple_preprocess
from gensim.parsing.preprocessing import preprocess_string
from gensim.corpora.dictionary import Dictionary
from gensim.models import LdaModel
from bs4 import BeautifulSoup
from markdown import markdown
from pprint import pprint
import re

def markdown_to_text(markdown_string):
    """ Converts a markdown string to plaintext """

    # md -> html -> text since BeautifulSoup can extract text cleanly
    html = markdown(markdown_string)

    # remove code snippets
    html = re.sub(r'<pre>(.*?)</pre>', ' ', html)
    html = re.sub(r'<code>(.*?)</code >', ' ', html)

    # extract text
    soup = BeautifulSoup(html, "html.parser")
    text = ''.join(soup.findAll(text=True))

    return text

@app.route('/gensim', methods=['GET'])
@jwt_required()
def run_gensim():
    user = current_identity

    entries = [markdown_to_text(_.text) for _ in user.entries]
    entries = [preprocess_string(_) for _ in entries]
    # entries = [simple_preprocess(_, deacc=True) for _ in entries]
    dictionary = Dictionary(entries)

    # Create a corpus from a list of texts
    common_corpus = [dictionary.doc2bow(text) for text in entries]

    # Train the model on the corpus
    lda = LdaModel(common_corpus, num_topics=n_topics)


    topics = {}
    for idx, topic in lda.show_topics(formatted=False, num_words=10):
        topics[idx] = [dictionary[int(w[0])] for w in topic]

    return jsonify(topics)


# https://github.com/viniciuschiele/flask-apscheduler/blob/master/examples/jobs.py
from flask_apscheduler import APScheduler
class Config(object):
    SCHEDULER_API_ENABLED = True
scheduler = APScheduler()
# interval examples
@scheduler.task('interval', id='do_job_1', seconds=120*60, misfire_grace_time=900)
def job1():
    with app.app_context():
        print("Running cron")
        for u in User.query.filter(User.habitica_user_id != None).all():
            sync_habitica_for(u)

app.config.from_object(Config())
scheduler.init_app(app)
scheduler.start()



import os

@app.route('/import')
@jwt_required()
def import_():
    # Set the directory you want to start from
    root = './jwtauthtest/gnrl'
    for _, _, files in os.walk(root):
        for fname in files:
            d = fname.replace('.md', '')
            d = dparse(d)
            with open(root + "/" + fname) as f:
                text = f.read()
            e = Entry(user_id=current_identity.id, created_at=d, text=text)
            e.run_models()
            db_session.add(e)
            db_session.commit()
    print('done')

    return jsonify({'ok':1})
