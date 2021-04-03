from pydantic import BaseModel
from common.utils import SECRET
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse

from fastapi_jwt_auth.exceptions import AuthJWTException
from fastapi_jwt_auth import AuthJWT

from app.singletons.app import app
from app.mail import send_mail
from common.database import with_db
import common.models as M


def on_after_register(user):
    #ga(user.id, 'user', 'register')
    with with_db() as db:
        t = M.Tag(user_id=user.id, main=True, selected=True, name='Main')
        db.add(t)
        db.commit()
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


def jwt_user(Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    uid = Authorize.get_jwt_subject()
    with with_db() as db:
        return db.query(M.User).get(uid)


app.include_router(router, prefix='/auth')
