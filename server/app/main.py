from app.app_app import app as app_
import app.app_jwt
import app.app_routes
from common.utils import is_dev
from typing import Optional
from fastapi import WebSocket, Query, Depends
from app.ws import WSManager

app = app_
mgr = WSManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    # register(websocket) sends user_event() to websocket
    await mgr.init_socket(websocket, token)


@app.on_event("startup")
async def startup():
    await mgr._startup()


@app.on_event("shutdown")
async def shutdown():
    await mgr._shutdown()

if __name__ == "__main__":
    args_ = {'debug': True} if is_dev() else {'port': 80}
    app.run(host='0.0.0.0', **args_)
