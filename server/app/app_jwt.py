import datetime, pdb
from app.app_app import app, logger
import app.models as M
from app.utils import vars, SECRET
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session
from fastapi import Depends
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException
from fastapi_sqlalchemy import db  # an object to provide global access to a database session


manager = LoginManager(SECRET, tokenUrl='/auth/token')


@manager.user_loader
def load_user(email: str):  # could also be an asynchronous function
    return db.session.query(M.User).filter_by(email=email).first()


@app.post('/auth/token')
def login(data: OAuth2PasswordRequestForm = Depends()):
    email = data.username
    password = data.password

    user = load_user(email)  # we are using the same function to retrieve the user
    if not user:
        raise InvalidCredentialsException  # you can also use your own HTTPException
    elif not pbkdf2_sha256.verify(password, user.hashed_password):
        raise InvalidCredentialsException

    access_token = manager.create_access_token(
        expires_delta=datetime.timedelta(seconds=60 * 60 * 24 * 7),  # 1 week
        data=dict(sub=email)
    )
    return {'access_token': access_token, 'token_type': 'bearer'}
