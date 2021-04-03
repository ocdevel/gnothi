from app.singletons.app import app
from app.singletons.ws import mgr
from app.rest.routes import nothing
from common.utils import is_dev
from typing import Optional
from fastapi import WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from common.database import init_db, shutdown_db
import common.models as M

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
    await mgr._startup()


@app.on_event("shutdown")
async def shutdown_session():
    shutdown_db()
    await mgr._shutdown()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    # register(websocket) sends user_event() to websocket
    await mgr.init_socket(websocket, token)


if __name__ == "__main__":
    args_ = {'debug': True} if is_dev() else {'port': 80}
    app.run(host='0.0.0.0', **args_)
