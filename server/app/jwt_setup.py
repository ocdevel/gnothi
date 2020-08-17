import datetime
from flask_jwt import JWT
from app import app
from app.models import User
from app.utils import vars
from passlib.hash import pbkdf2_sha256


def authenticate(username, password):
    user = User.query.filter_by(username=username).first()
    if user and pbkdf2_sha256.verify(password, user.password):
        return user


def identity(payload):
    user_id = payload['identity']
    return User.query.get(user_id)


app.config['JWT_SECRET_KEY'] = vars.FLASK_KEY

# - https://github.com/jpadilla/django-jwt-auth/blob/master/README.md#additional-settings
# - https://pythonhosted.org/Flask-JWT/#configuration-options
# app.config['JWT_LEEWAY'] = 30000  # what's difference w JWT_EXPIRATION_DELTA?
app.config['JWT_EXPIRATION_DELTA'] = datetime.timedelta(seconds=60 * 60 * 24 * 7)  # 1 week

jwt = JWT(app, authenticate, identity)
