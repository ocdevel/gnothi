from flask_jwt import jwt_required
from jwtauthtest import app
from jwtauthtest.database import db_session
from jwtauthtest.models import User
from passlib.hash import pbkdf2_sha256
from flask import request

def useradd(username, password):
    db_session.add(User(username, pbkdf2_sha256.hash(password)))
    db_session.commit()


@app.route('/hello')
@jwt_required()
def hello():
    return 'Hello world!'


@app.route('/register', methods=['POST'])
def register():
    useradd(request.form['username'], request.form['password'])

## actually, this is built into flask_jwt
# @app.route('/auth', methods=['POST'])
# def register():
#     useradd(request.form['username'], request.form['password'])
