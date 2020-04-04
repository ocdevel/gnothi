import pdb
from flask_jwt import jwt_required, current_identity
from jwtauthtest import app
from jwtauthtest.database import db_session
from jwtauthtest.models import User, Entry
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
        user.entries.append(Entry(data['title'], data['text']))
        db_session.commit()
        return jsonify({'ok': True})


@app.route('/entries/:id', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def entry(id):
    return jsonify({'ok', True})
