from flask_jwt import JWT
from jwtauthtest import app
from jwtauthtest.models import User
from passlib.hash import pbkdf2_sha256
from os import environ


def authenticate(username, password):
    user = User.query.filter_by(username=username).first()
    if user and pbkdf2_sha256.verify(password, user.password):
        return user


def identity(payload):
    user_id = payload['identity']
    return User.query.get(user_id)


app.config['SECRET_KEY'] = environ.get('JWT_SECRET_KEY')
app.config['JWT_LEEWAY'] = 30000  # FIXME figure this out
jwt = JWT(app, authenticate, identity)
