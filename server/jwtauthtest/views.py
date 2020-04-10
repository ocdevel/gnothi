import pdb, logging
from flask_jwt import jwt_required, current_identity
from jwtauthtest import app
from jwtauthtest.database import db_session, engine
from jwtauthtest.models import User, Entry, Field, FieldEntry
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify
from jwtauthtest.utils import vars

from xgboost import XGBRegressor
import pandas as pd

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
        for k, v in data['fields'].items():
            entry.field_entries.append(FieldEntry(value=v, field_id=k))
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
        fe_map = {f.field_id: f for f in entry.field_entries}
        for k, v in data['fields'].items():
            f = fe_map.get(k, None)
            if f:
                f.value = v
            if not f:
                entry.field_entries.append(FieldEntry(value=v, field_id=k))
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
        return jsonify({'fields': [f.json() for f in user.fields]})
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
        FieldEntry.query.filter_by(field_id=field_id).delete()
        Field.query.filter_by(user_id=user.id, id=field_id).delete()
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


import requests
@app.route('/habitica/<entry_id>', methods=['GET'])
@jwt_required()
def get_habitica(entry_id):
    app.logger.info("Start of Habitica")

    user = current_identity
    entry = Entry.query\
        .filter_by(user_id=user.id, id=entry_id)\
        .first()

    app.logger.info("Calling Habitica")

    # https://habitica.com/apidoc/#api-Task-GetUserTasks
    r = requests.get(
        'https://habitica.com/api/v3/tasks/user',
        headers={
            "Content-Type": "application/json",
            "x-api-user": user.habitica_user_id,
            "x-api-key": user.habitica_api_token,
            "x-client": f"{vars.HABIT.USER}-{vars.HABIT.APP}"
        }
    )
    r = r.json()

    app.logger.info("Habitica finished")

    f_id_map = {f.service_id: f for f in user.fields}
    fe_id_map = {f.field_id: f for f in entry.field_entries}
    t_id_map = {task['id']: task for task in r['data']}

    # Remove Habitica-deleted tasks
    for f in user.fields:
        if f.service != 'habitica': continue
        if f.service_id not in t_id_map:
            # FIXME change models to cascade deletes, remove line below https://dev.to/zchtodd/sqlalchemy-cascading-deletes-8hk
            FieldEntry.query.filter_by(field_id=f.id).delete()
            db_session.delete(f)

    # Add/update tasks from Habitica
    for task in r['data']:
        # {id, text, type, value}
        # habit: {counterUp, counterDown}
        # daily:{checklist: [{completed}], completed, isDue}

        # only care about habits/dailies
        if task['type'] not in ['habit', 'daily']: continue

        f = f_id_map.get(task['id'], None)
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

        fe = fe_id_map.get(f.id, None)
        if fe:
            fe.value = value
        else:
            fe = FieldEntry(field_id=f.id)
            entry.field_entries.append(fe)
        db_session.commit()
        app.logger.info(task['text'] + " done")

    return jsonify({'ok': True})


@app.route('/influencers', methods=['GET'])
@jwt_required()
def influencers():
    user = current_identity
    with engine.connect() as conn:
        df = pd.read_sql("""
        select fe.value, 
            e.created_at, 
            f.id as fid, f.target
        from field_entries fe
        join fields f on f.id=fe.field_id
        join entries e on e.id=fe.entry_id
        where f.user_id=%(user_id)s
            -- exclude these to improve model perf
            -- TODO reconsider for past data
            and f.excluded_at is null 
        order by e.created_at asc
        """, conn, params={'user_id': user.id})

        defaults = pd.read_sql("""
        select id, default_value, default_value_value
        from fields
        where user_id=%(user_id)s
        """, conn, params={'user_id': user.id})
        defaults = {str(r.id): r for i, r in defaults.iterrows()}

    # uuid as string
    df['fid'] = df.fid.apply(lambda x: str(x))
    ## Easier debugging
    # df['fid'] =  df.fid.apply(lambda x: x[0:4])
    is_target = (df.target==True)
    fields = ['value', 'created_at', 'fid']
    X = df[~is_target][fields].pivot(index='created_at', columns='fid')
    for _, fid in X.columns:
        dv, dvv = defaults[fid].default_value, defaults[fid].default_value_value
        if not dv: continue
        if dv == 'value':
            if not dvv: continue
            X[fid] = X[fid].fillna(dvv)
        elif dv == 'ffill':
            X[fid] = X[fid].fillna(method=X[fid].ffill())
        elif df == 'average':
            X[fid] = X[fid].fillna(X[fid].mean())

    Y = df[is_target][fields].set_index(['fid', 'created_at'])
    cols = [c[1] for c in X.columns]

    targets = {}
    specific_target = request.args.get('target', None)
    for target, group in Y.groupby(level=0):
        if specific_target and specific_target != target:
            continue
        model = XGBRegressor()
        # This part is important. Rather than say "what today predicts y" (not useful),
        # or even "what history predicts y" (would be time-series models, which don't have feature_importances_)
        # we can approximate it a rolling average of activity.
        # TODO not sure which window fn to use: rolling|expanding|ewm?
        # https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.rolling.html
        # http://people.duke.edu/~ccc14/bios-823-2018/S18A_Time_Series_Manipulation_Smoothing.html#Window-functions
        mult_day_avg = X.ewm(span=5).mean()
        model.fit(mult_day_avg, group.value)
        imps = [float(x) for x in model.feature_importances_]
        targets[target] = dict(zip(cols, imps))
    return jsonify(targets)
