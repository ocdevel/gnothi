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


jwt_lifetime = 60 * 60 * 24 * 7  # 1wk. TODO implement token refresh
jwt_authentication = JWTAuthentication(secret=SECRET, lifetime_seconds=jwt_lifetime)
fastapi_users = FastAPIUsers(
    M.user_db, [jwt_authentication], M.FU_User, M.FU_UserCreate, M.FU_UserUpdate, M.FU_UserDB,
)

@app.post("/auth/jwt/refresh")
async def refresh_jwt(response: Response, user=Depends(fastapi_users.get_current_user)):
    return await jwt_authentication.get_login_response(user, response)

def on_after_register(user: M.FU_UserDB, request: Request):
    ga(user.id, 'user', 'register')
    with db():
        t = M.Tag(user_id=user.id, main=True, selected=True, name='Main')
        db.session.add(t)
        db.session.commit()
    send_mail(user.email, "welcome", {})

def on_after_forgot_password(user: M.FU_UserDB, token: str, request: Request):
    send_mail(user.email, "forgot-password", token)

def on_after_update(user: M.FU_UserDB, updated_user_data: Dict[str, Any], request: Request):
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
