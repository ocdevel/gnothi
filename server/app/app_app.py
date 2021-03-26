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


@app.on_event("startup")
async def startup():
    init_db()


@app.on_event("shutdown")
async def shutdown_session():
    shutdown_db()

