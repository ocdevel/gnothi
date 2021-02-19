"""
Adapted from https://github.com/cthwaite/fastapi-websocket-broadcast

TODO implement react websockets https://www.pluralsight.com/guides/using-web-sockets-in-your-reactredux-app
# https://github.com/tiangolo/fastapi/issues/129
"""

from app.app_app import app
import pdb, re, datetime, logging, boto3, io
import common.models as M
from typing import List
from fastapi_sqlalchemy import db
from fastapi import APIRouter
from fastapi import WebSocket #, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi_socketio import SocketManager


"""Demonstration of websocket chat app using FastAPI, Starlette, and an in-memory
broadcast backend.
"""

import logging, time, asyncio
from enum import Enum
from typing import Any, Dict, List, Optional

from fastapi import Body, FastAPI, HTTPException
from pydantic import BaseModel
from starlette.endpoints import WebSocketEndpoint
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import FileResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.websockets import WebSocket


logger = logging.getLogger(__name__)
getuser = M.User.snoop
router = APIRouter()

import socketio
sio = SocketManager(app=app, cors_allowed_origins=[])


class MyCustomNamespace(socketio.AsyncNamespace):
    def __init__(self, *args, **kwargs):
        self._clients = {}
        super().__init__(*args, **kwargs)

    def on_connect(self, sid, environ):
        self._clients[sid] = True
        logger.info(self._clients)
        sio.emit(f"{sid} connected")

    def on_disconnect(self, sid):
        pass

    async def on_message(self, sid, data):
        await self.emit('message', data)

sio._sio.register_namespace(MyCustomNamespace('/groups'))


# @sio.on('connect')
# async def connect(sid, environ):
#     print(sio._sio.get_session("test"))
#     await sio._sio.save_session("test", {"test": 1})
#
# @sio.on('disconnect')
# def on_disconnect(sid):
#     logger.info('disconnect')
#     pass
#
# async def on_my_event(self, sid, data):
#     await self.emit('my_response', data)


class RoomEventMiddleware:  # pylint: disable=too-few-public-methods
    """Middleware for providing a global :class:`~.Room` instance to both HTTP
    and WebSocket scopes.
    Although it might seem odd to load the broadcast interface like this (as
    opposed to, e.g. providing a global) this both mimics the pattern
    established by starlette's existing DatabaseMiddlware, and describes a
    pattern for installing an arbitrary broadcast backend (Redis PUB-SUB,
    Postgres LISTEN/NOTIFY, etc) and providing it at the level of an individual
    request.
    """

    def __init__(self, app: ASGIApp):
        self._app = app
        # self._room = Room()
        self._clients = {}
        asyncio.ensure_future(self.loop())

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        await self._app(scope, receive, send)

    async def loop(self):
        with db():
            while True:
                res = M.Machine.gpu_status(db.session)
                await sio.emit("AI_STATUS", {"status": res})
                await asyncio.sleep(2)


class UserListResponse(BaseModel):
    """Response model for /list_users endpoint.
    """

    users: List[str]


@router.get("/users2", response_model=UserListResponse)
async def list_users(request: Request):
    return {"users": []}
    # room: Optional[Room] = request.get("room")
    # if room is None:
    #     raise HTTPException(500, detail="Global `Room` instance unavailable!")
    # return {"users": room.user_list}

app.include_router(router)
app.add_middleware(RoomEventMiddleware)
