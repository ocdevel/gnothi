import socketio
from typing import Union
from fastapi import FastAPI

class SocketManager:
    def __init__(
        self,
        app: FastAPI,
        mount_location: str = "/ws",
        socketio_path: str = "socket.io",
        cors_allowed_origins: Union[str, list] = '*',
    ) -> None:
        # TODO: Change Cors policy based on fastapi cors Middleware
        # self._sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=cors_allowed_origins)
        self._mgr = socketio.AsyncRedisManager('redis://192.168.0.2:6379')
        self._sio = socketio.AsyncServer(client_manager=self._mgr, async_mode="asgi", cors_allowed_origins=cors_allowed_origins)
        self._app = socketio.ASGIApp(
            socketio_server=self._sio, socketio_path=socketio_path
        )

        app.mount(mount_location, self._app)
        app.sio = self._sio

    def is_asyncio_based(self) -> bool:
        return True

