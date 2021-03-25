from pydantic import BaseModel
from common.utils import SECRET
from fastapi_sqlalchemy import db
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from fastapi_jwt_auth.exceptions import AuthJWTException
from fastapi_jwt_auth import AuthJWT

from app.app_app import app
from app.mail import send_mail
from app.google_analytics import ga
import common.models as M


def on_after_register(user):
    ga(user.id, 'user', 'register')
    with db():
        t = M.Tag(user_id=user.id, main=True, selected=True, name='Main')
        db.session.add(t)
        db.session.commit()
    send_mail(user.email, "welcome", {})


# 233da7ae: fastapi-users gutted here, only using for bells/whistles (model setup, registration,
# reset-password, and soon verify password). Using instead fastapi-jwt-auth for per-route jwt
# verification since it supports refresh tokens.


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

@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(request: Request, exc: AuthJWTException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "jwt_error": True}
    )


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
    new_access_token = Authorize.create_access_token(subject=current_user)
    return {"access_token": new_access_token}

# See https://indominusbyte.github.io/fastapi-jwt-auth/usage/freshness/
# for freshness tokens required for one-time critical routes, like deleting account etc

def jwt_user(Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    uid = Authorize.get_jwt_subject()
    return db.session.query(M.User).get(uid)


app.include_router(router, prefix='/auth')
