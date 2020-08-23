from typing import Dict, Any
import datetime, pdb
from app.app_app import app
from app.utils import vars, SECRET
from app.mail import send_mail
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session
from fastapi import Depends, Response, Request
from fastapi_sqlalchemy import db  # an object to provide global access to a database session

from fastapi_users.authentication import JWTAuthentication
from fastapi_users import FastAPIUsers
import app.schemas as S
import app.models as M


jwt_lifetime = 60 * 60 * 24 * 7  # 1wk. TODO implement token refresh
jwt_authentication = JWTAuthentication(secret=SECRET, lifetime_seconds=jwt_lifetime)
fastapi_users = FastAPIUsers(
    M.user_db, [jwt_authentication], S.User, S.UserCreate, S.UserUpdate, S.UserIn,
)

@app.post("/auth/jwt/refresh")
async def refresh_jwt(response: Response, user=Depends(fastapi_users.get_current_user)):
    return await jwt_authentication.get_login_response(user, response)

def on_after_register(user: S.UserIn, request: Request):
    with db():
        # if db.session.query(M.User).filter(M.User.username == data.username).first():
        #     return send_error(response, "Email already taken")
        # u = M.User(data.username, pbkdf2_sha256.hash(data.password))
        t = M.Tag(user_id=user.id, main=True, selected=True, name='Main')
        db.session.add(t)
        db.session.commit()
    print(f"User {user.id} has registered.")

def on_after_forgot_password(user: S.UserIn, token: str, request: Request):
    send_mail(user.email, token)
    print(f"User {user.id} has forgot their password. Reset token: {token}")

def on_after_update(user: S.UserIn, updated_user_data: Dict[str, Any], request: Request):
    print(f"User {user.id} has been updated with the following data: {updated_user_data}")

app.include_router(
    fastapi_users.get_auth_router(jwt_authentication), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(on_after_register), prefix="/auth", tags=["auth"]
)
app.include_router(
    fastapi_users.get_reset_password_router(
        SECRET, after_forgot_password=on_after_forgot_password
    ),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(fastapi_users.get_users_router(on_after_update), prefix="/users", tags=["users"])

# ----
#
# manager = LoginManager(SECRET, tokenUrl='/auth/token')
#
#
# @manager.user_loader
# def load_user(email: str):  # could also be an asynchronous function
#     return db.session.query(M.User).filter_by(username=email).first()
#
#
# @app.post('/auth/token')
# def login(data: OAuth2PasswordRequestForm = Depends()):
#     email = data.username
#     password = data.password
#
#     user = load_user(email)  # we are using the same function to retrieve the user
#     if not user:
#         raise InvalidCredentialsException  # you can also use your own HTTPException
#     elif not pbkdf2_sha256.verify(password, user.password):
#         raise InvalidCredentialsException
#
#     access_token = manager.create_access_token(
#         expires_delta=datetime.timedelta(seconds=60 * 60 * 24 * 7),  # 1 week
#         data=dict(sub=email)
#     )
#     return {'access_token': access_token, 'token_type': 'bearer'}
