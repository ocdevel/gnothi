import pdb
from flask_jwt import jwt_required, current_identity
from jwtauthtest import app
from jwtauthtest.database import db_session
from jwtauthtest.models import User, Entry, FieldEntry
from passlib.hash import pbkdf2_sha256
from flask import request, jsonify

def useradd(username, password):
    db_session.add(User(username, pbkdf2_sha256.hash(password)))
    db_session.commit()


@app.route('/check-jwt')
@jwt_required()
def check_jwt():
    return jsonify({'ok': True})


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
        entry = Entry(data['title'], data['text'])
        user.entries.append(entry)
        for k, v in data['fields'].items():
            entry.field_entries.append(FieldEntry(v, k))
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
        for f in entry.field_entries:
            f.value = data['fields'][str(f.id)]
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
