# FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_sqlalchemy import DBSessionMiddleware  # middleware helper

# Database
from common.database import init_db, shutdown_db, fa_users_db, engine
from common.utils import vars, SECRET

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

@app.on_event("startup")
async def startup():
    await fa_users_db.connect()
    init_db()


@app.on_event("shutdown")
async def shutdown_session():
    await fa_users_db.disconnect()
    shutdown_db()

