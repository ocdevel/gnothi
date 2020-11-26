from typing import Dict, Any
import datetime, pdb
from app.app_app import app
from common.utils import vars, SECRET
from app.mail import send_mail
from fastapi import Depends, Response, Request, BackgroundTasks
from fastapi_sqlalchemy import db  # an object to provide global access to a database session

from fastapi_users.authentication import JWTAuthentication
from fastapi_users import FastAPIUsers
import common.models as M
from app.google_analytics import ga


jwt_authentication = JWTAuthentication(secret=SECRET, lifetime_seconds=60*5)
fastapi_users = FastAPIUsers(
    M.user_db, [jwt_authentication], M.FU_User, M.FU_UserCreate, M.FU_UserUpdate, M.FU_UserDB,
)

def on_after_register(user: M.FU_UserDB, request: Request):
    ga(user.id, 'user', 'register')
    with db():
        t = M.Tag(user_id=user.id, main=True, selected=True, name='Main')
        db.session.add(t)
        db.session.commit()
    send_mail(user.email, "welcome", {})

def on_after_forgot_password(user: M.FU_UserDB, token: str, request: Request):
    send_mail(user.email, "forgot-password", token)

# def on_after_update(user: M.FU_UserDB, updated_user_data: Dict[str, Any], request: Request):
#     print(f"User {user.id} has been updated with the following data: {updated_user_data}")

# app.include_router(
#     fastapi_users.get_auth_router(jwt_authentication), prefix="/auth/jwt", tags=["auth"]
# )

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

# app.include_router(fastapi_users.get_users_router(on_after_update), prefix="/users", tags=["users"])




from fastapi import FastAPI, HTTPException, Depends, Request, APIRouter
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel
from common.utils import SECRET
from fastapi_sqlalchemy import db
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from fastapi_users.router.common import ErrorCode


# in production you can use Settings management
# from pydantic to get secret key from .env
class Settings(BaseModel):
    authjwt_secret_key: str = SECRET
    # authjwt_access_token_expires: int = 10


# callback to get your configuration
@AuthJWT.load_config
def get_config():
    return Settings()


router = APIRouter()


# Standard login endpoint. Will return a fresh access token and a refresh token
@router.post('/login')
async def login(
    credentials: OAuth2PasswordRequestForm = Depends(),
    Authorize: AuthJWT = Depends()
):
    user = await M.user_db.authenticate(credentials)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.LOGIN_BAD_CREDENTIALS,
        )
        # raise HTTPException(status_code=401, detail="Bad username or password")

    """
    create_access_token supports an optional 'fresh' argument,
    which marks the token as fresh or non-fresh accordingly.
    As we just verified their username and password, we are
    going to mark the token as fresh here.
    """
    access_token = Authorize.create_access_token(subject=str(user.id), fresh=True)
    refresh_token = Authorize.create_refresh_token(subject=str(user.id))
    return {"access_token": access_token, "refresh_token": refresh_token}


@router.post('/refresh')
def refresh(Authorize: AuthJWT = Depends()):
    """
    Refresh token endpoint. This will generate a new access token from
    the refresh token, but will mark that access token as non-fresh,
    as we do not actually verify a password in this endpoint.
    """
    Authorize.jwt_refresh_token_required()

    current_user = Authorize.get_jwt_subject()
    new_access_token = Authorize.create_access_token(subject=current_user, fresh=True)
    return {"access_token": new_access_token}

# @router.post('/fresh-login')
# def fresh_login(user: M.FU_UserCreate, Authorize: AuthJWT = Depends()):
#     """
#     Fresh login endpoint. This is designed to be used if we need to
#     make a fresh token for a user (by verifying they have the
#     correct username and password). Unlike the standard login endpoint,
#     this will only return a new access token, so that we don't keep
#     generating new refresh tokens, which entirely defeats their point.
#     """
#     passw = users.get(user.username, None)
#     if not (passw and passw == user.password):
#         raise HTTPException(status_code=401, detail="Bad username or password")
#
#     new_access_token = Authorize.create_access_token(subject=user.username,fresh=True)
#     return {"access_token": new_access_token}

from fastapi_jwt_auth.exceptions import AuthJWTException

def jwt_user(Authorize: AuthJWT = Depends()):
    try:
        Authorize.fresh_jwt_required()
    except AuthJWTException as exc:
        # raise HTTPException(status_code=exc.status_code, detail=exc.message)
        raise HTTPException(status_code=400, detail="JWT error")
    uid = Authorize.get_jwt_subject()
    return db.session.query(M.User).get(uid)


app.include_router(router, prefix='/auth')
