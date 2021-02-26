# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_sqlalchemy import DBSessionMiddleware  # middleware helper

# Database
from common.database import init_db, shutdown_db, fa_users_db, engine
from common.utils import vars, SECRET

import common.models as M
from fastapi_sqlalchemy import db

app = FastAPI()
# app.secret_key = SECRET
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(DBSessionMiddleware, db_url=vars.DB_FULL)
# 9131155e: attempted log-filtering


def init_groups():
    with db():
        ct = db.session.execute('select count(*) ct from groups').first().ct
        if ct > 0: return
        db.session.add(M.Group(
            id='ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035',
            owner=db.session.execute("select id from users where email='tylerrenelle@gmail.com'").first().id,
            title='Gnothi',
            text='Main Gnothi group. Basically a global chatroom, see topical groups on the right',
            privacy=M.GroupPrivacy.public
        ))
        db.session.commit()

@app.on_event("startup")
async def startup():
    await fa_users_db.connect()
    init_db()
    init_groups()


@app.on_event("shutdown")
async def shutdown_session():
    await fa_users_db.disconnect()
    shutdown_db()

