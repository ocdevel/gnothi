# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database
from common.database import init_db, shutdown_db, engine, with_db
from common.utils import vars, SECRET

import common.models as M

app = FastAPI()
# app.secret_key = SECRET
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# 9131155e: attempted log-filtering


def init_groups():
    with with_db() as db:
        ct = db.execute('select count(*) ct from groups').first().ct
        if ct > 0: return
        db.add(M.Group(
            id='ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035',
            owner=db.execute("select id from users where email='tylerrenelle@gmail.com'").first().id,
            title='Gnothi',
            text='Main Gnothi group. Basically a global chatroom, see topical groups on the right',
            privacy=M.GroupPrivacy.public
        ))
        db.commit()

@app.on_event("startup")
async def startup():
    init_db()
    init_groups()


@app.on_event("shutdown")
async def shutdown_session():
    shutdown_db()

