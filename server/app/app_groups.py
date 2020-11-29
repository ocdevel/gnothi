"""
Adapted from https://github.com/cthwaite/fastapi-websocket-broadcast

TODO implement react websockets https://www.pluralsight.com/guides/using-web-sockets-in-your-reactredux-app
"""

import pdb, re, datetime, logging, boto3, io
import common.models as M
from fastapi import APIRouter

logger = logging.getLogger(__name__)

getuser = M.User.snoop

from typing import List

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

router = APIRouter()


html = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>FastAPI Websocket Chat</title>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet">
    <style>
        #main {
            margin-top: 4rem;
        }
        #chatbox {
            overflow-y: scroll;
            height: 40rem;
        }
        .thin-alert {
            padding: .25rem 1.25rem;
        }
    </style>
  </head>
  <body>
    <div class="container">
        <div id="main" class="row">
            <div class="col-md-9">
                <h4>Chat</h4>
                <div id="chatbox">
                    <div id="messages"></div>
                </div>
                <form>
                    <div class="form-group row">
                        <label for="chat-input" class="col-sm-1 col-form-label">Message</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="chat-input" placeholder="Enter message...">
                        </div>
                        <div class="col-sm-2">
                            <button type="submit" class="btn btn-primary" disabled="disabled">Send</button>
                        </div>
                    </div>
                </form>
            </div>
            <div class="col-md-3">
                <h4>Connected Users</h4>
                <ul id="users"></ul>
            </div>
      </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script>
    /** Add a user to the list of connected users.*/
    function addToUsersList(userId, isYou) {
        const newUserLi = $('<li id="users-list-' + userId + '"></li>');
        newUserLi.append(userId);
        if(isYou) {
            newUserLi.append($('<em> (you)</em>'));
        }
        $('#users').append(newUserLi);
    }

    /** Clear the users list. */
    function clearUsersList() {
        $('#users').empty();
    }

    /** Add a user to the list of connected users and print an alert.*/
    function addUser(userId) {
        console.log('Adding user to connected users list:', userId);
        addToUsersList(userId);
        addSystemMessage($('<span>User <strong>' + userId + '</strong> joined the room</span>'));
    }

    /** Remove a user from the list of connected users and print an alert.*/
    function removeUser(userId) {
        console.log('Removing user from connected users list:', userId);
        $('li#users-list-' + userId).remove();
        addSystemMessage($('<span>User <strong>' + userId + '</strong> left the room</span>'));
    }

    /** Add a new chat message from a named user. */
    function addChatMessage(userId, msg) {
        const newMessage = $('<div class="alert thin-alert" role="alert"></div>');
        const userSays = $('<strong>' + userId + ':  </strong>');
        if(userId === myUserId) {
            newMessage.addClass('alert-secondary');
        } else {
            newMessage.addClass('alert-info');
        }
        newMessage.append(userSays);
        newMessage.append(msg);
        $('#messages').append(newMessage);
    }

    /** Add a new system message (e.g. user joined/left) to the chat. */
    function addSystemMessage(msg) {
        const newMessage = $('<div class="alert thin-alert alert-success" role="alert"></div>');
        newMessage.append(msg);
        $('#messages').append(newMessage);
    }

    /** Add a new error message to the chat. */
    function addErrorMessage(msg) {
        const newMessage = $('<div class="alert thin-alert alert-danger" role="alert"></div>');
        newMessage.append(msg);
        $('#messages').append(newMessage);
    }

    /** Handle an incoming message from the websocket connection. */
    function onWebsocketMessage(message) {
        console.log('Got message from websocket:', message);
        const payload = JSON.parse(message.data);
        switch(payload.type) {
            case 'MESSAGE':
                if(payload.data.user_id === 'server') {
                    addSystemMessage(payload.data.msg);
                } else {
                    addChatMessage(payload.data.user_id, payload.data.msg);
                }
                return;
            case 'USER_JOIN':
                addUser(payload.data);
                return;
            case 'USER_LEAVE':
                removeUser(payload.data);
                return;
            case 'ROOM_JOIN':
                myUserId = payload.data.user_id;
                addToUsersList(myUserId, true);
                return;
            case 'ROOM_KICK':
                addErrorMessage(payload.data.msg);
                clearUsersList();
                return;
            case 'ERROR':
                addErrorMessage(payload.data.msg);
                return;
            default:
                throw new TypeError('Unknown message type: ' + payload.type);
                return;
        }
    }


    function onClickFactory(websocket) {
        return function (event) {
            event.preventDefault();

            const $messageInput = $('#chat-input');
            const message = $messageInput.val();
            $messageInput.val('');
            if (!message) {
                return
            }

            websocket.send(message);
        }
    }

    /** Join up the 'submit' button to the websocket interface. */
    function onWebsocketOpen(websocket) {
        console.log('Opening WebSocket connection');
        return function () {
            $('button[type="submit"]')
                .on('click', onClickFactory(websocket))
                .removeAttr('disabled');
        }
    }

    /** Print websocket errors into the chat box using addErrorMessage. */
    function onWebsocketError(err) {
        console.error('Websocket error: ', err);
        addErrorMessage('Error:' + err, 'error');
        onWebsocketClose();
    }

    /** Disable the 'submit' button when the websocket connection closes. */
    function onWebsocketClose() {
        console.log('Closing WebSocket connection');
        $('button[type="submit"]')
            .off('click')
            .attr('disabled', 'disabled');
    }

    /** On page load, open a websocket connection, and fetch the list of active users. */ 
    $(function() {
        function reqListener () {
            const userData = JSON.parse(this.responseText);
            console.log('Received user list:', userData);
            userData.users.forEach(addToUsersList);
            $(function() {
                let myUserId = null;
                websocket = new WebSocket('ws://localhost:5002/ws');
                websocket.onopen = onWebsocketOpen(websocket);
                websocket.onerror = onWebsocketError;
                websocket.onclose = onWebsocketClose;
                websocket.onmessage = onWebsocketMessage;
            });
        }
        const oReq = new XMLHttpRequest();
        oReq.addEventListener("load", reqListener);
        oReq.open("GET", "http://localhost:5002/users2");
        oReq.send();
    });

    </script>
  </body>
</html>
"""


"""Demonstration of websocket chat app using FastAPI, Starlette, and an in-memory
broadcast backend.
"""

import logging
import time
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


# app.debug = True

log = logging.getLogger(__name__)  # pylint: disable=invalid-name


class UserInfo(BaseModel):
    """Chatroom user metadata.
    """

    user_id: str
    connected_at: float
    message_count: int


class Room:
    """Room state, comprising connected users.
    """

    def __init__(self):
        log.info("Creating new empty room")
        self._users: Dict[str, WebSocket] = {}
        self._user_meta: Dict[str, UserInfo] = {}

    def __len__(self) -> int:
        """Get the number of users in the room.
        """
        return len(self._users)

    @property
    def empty(self) -> bool:
        """Check if the room is empty.
        """
        return len(self._users) == 0

    @property
    def user_list(self) -> List[str]:
        """Return a list of IDs for connected users.
        """
        return list(self._users)

    def add_user(self, user_id: str, websocket: WebSocket):
        """Add a user websocket, keyed by corresponding user ID.
        Raises:
            ValueError: If the `user_id` already exists within the room.
        """
        if user_id in self._users:
            raise ValueError(f"User {user_id} is already in the room")
        log.info("Adding user %s to room", user_id)
        self._users[user_id] = websocket
        self._user_meta[user_id] = UserInfo(
            user_id=user_id, connected_at=time.time(), message_count=0
        )

    async def kick_user(self, user_id: str):
        """Forcibly disconnect a user from the room.
        We do not need to call `remove_user`, as this will be invoked automatically
        when the websocket connection is closed by the `RoomLive.on_disconnect` method.
        Raises:
            ValueError: If the `user_id` is not held within the room.
        """
        if user_id not in self._users:
            raise ValueError(f"User {user_id} is not in the room")
        await self._users[user_id].send_json(
            {
                "type": "ROOM_KICK",
                "data": {"msg": "You have been kicked from the chatroom!"},
            }
        )
        log.info("Kicking user %s from room", user_id)
        await self._users[user_id].close()

    def remove_user(self, user_id: str):
        """Remove a user from the room.
        Raises:
            ValueError: If the `user_id` is not held within the room.
        """
        if user_id not in self._users:
            raise ValueError(f"User {user_id} is not in the room")
        log.info("Removing user %s from room", user_id)
        del self._users[user_id]
        del self._user_meta[user_id]

    def get_user(self, user_id: str) -> Optional[UserInfo]:
        """Get metadata on a user.
        """
        return self._user_meta.get(user_id)

    async def whisper(self, from_user: str, to_user: str, msg: str):
        """Send a private message from one user to another.
        Raises:
            ValueError: If either `from_user` or `to_user` are not present
                within the room.
        """
        if from_user not in self._users:
            raise ValueError(f"Calling user {from_user} is not in the room")
        log.info("User %s messaging user %s -> %s", from_user, to_user, msg)
        if to_user not in self._users:
            await self._users[from_user].send_json(
                {
                    "type": "ERROR",
                    "data": {"msg": f"User {to_user} is not in the room!"},
                }
            )
            return
        await self._users[to_user].send_json(
            {
                "type": "WHISPER",
                "data": {"from_user": from_user, "to_user": to_user, "msg": msg},
            }
        )

    async def broadcast_message(self, user_id: str, msg: str):
        """Broadcast message to all connected users.
        """
        self._user_meta[user_id].message_count += 1
        for websocket in self._users.values():
            await websocket.send_json(
                {"type": "MESSAGE", "data": {"user_id": user_id, "msg": msg}}
            )

    async def broadcast_user_joined(self, user_id: str):
        """Broadcast message to all connected users.
        """
        for websocket in self._users.values():
            await websocket.send_json({"type": "USER_JOIN", "data": user_id})

    async def broadcast_user_left(self, user_id: str):
        """Broadcast message to all connected users.
        """
        for websocket in self._users.values():
            await websocket.send_json({"type": "USER_LEAVE", "data": user_id})


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
        self._room = Room()

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] in ("lifespan", "http", "websocket"):
            scope["room"] = self._room
        await self._app(scope, receive, send)





@router.get("/")
def home():
    """Serve static index page.
    """
    return HTMLResponse(html)



class UserListResponse(BaseModel):
    """Response model for /list_users endpoint.
    """

    users: List[str]


@router.get("/users2", response_model=UserListResponse)
async def list_users(request: Request):
    """List all users connected to the room.
    """
    room: Optional[Room] = request.get("room")
    if room is None:
        raise HTTPException(500, detail="Global `Room` instance unavailable!")
    return {"users": room.user_list}


class UserInfoResponse(UserInfo):
    """Response model for /users/:user_id endpoint.
    """


@router.get("/users2/{user_id}", response_model=UserInfoResponse)
async def get_user_info(request: Request, user_id: str):
    room: Optional[Room] = request.get("room")
    if room is None:
        raise HTTPException(500, detail="Global `Room` instance unavailable!")
    user = room.get_user(user_id)
    if user is None:
        raise HTTPException(404, detail=f"No such user: {user_id}")
    return user


@router.post("/users2/{user_id}/kick", response_model=UserListResponse)
async def kick_user(request: Request, user_id: str):
    """List all users connected to the room.
    """
    room: Optional[Room] = request.get("room")
    if room is None:
        raise HTTPException(500, detail="Global `Room` instance unavailable!")
    try:
        await room.kick_user(user_id)
    except ValueError:
        raise HTTPException(404, detail=f"No such user: {user_id}")


class Distance(str, Enum):
    """Distance classes for the /thunder endpoint.
    """

    Near = "near"
    Far = "far"
    Extreme = "extreme"


class ThunderDistance(BaseModel):
    """Indicator of distance for /thunder endpoint.
    """

    category: Distance


@router.post("/thunder")
async def thunder(request: Request, distance: ThunderDistance = Body(...)):
    """Broadcast an ambient message to all chat room users.
    """
    room: Optional[Room] = request.get("room")
    if room is None:
        raise HTTPException(500, detail="Global `Room` instance unavailable!")
    if distance.category == Distance.Near:
        await room.broadcast_message("server", "Thunder booms overhead")
    elif distance.category == Distance.Far:
        await room.broadcast_message("server", "Thunder rumbles in the distance")
    else:
        await room.broadcast_message("server", "You feel a faint tremor")


@router.websocket_route("/ws", name="ws")
class RoomLive(WebSocketEndpoint):
    """Live connection to the global :class:`~.Room` instance, via WebSocket.
    """

    encoding: str = "text"
    session_name: str = ""
    count: int = 0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room: Optional[Room] = None
        self.user_id: Optional[str] = None

    @classmethod
    def get_next_user_id(cls):
        """Returns monotonically increasing numbered usernames in the form
            'user_[number]'
        """
        user_id: str = f"user_{cls.count}"
        cls.count += 1
        return user_id

    async def on_connect(self, websocket):
        """Handle a new connection.
        New users are assigned a user ID and notified of the room's connected
        users. The other connected users are notified of the new user's arrival,
        and finally the new user is added to the global :class:`~.Room` instance.
        """
        log.info("Connecting new user...")
        room: Optional[Room] = self.scope.get("room")
        if room is None:
            raise RuntimeError(f"Global `Room` instance unavailable!")
        self.room = room
        self.user_id = self.get_next_user_id()
        await websocket.accept()
        await websocket.send_json(
            {"type": "ROOM_JOIN", "data": {"user_id": self.user_id}}
        )
        await self.room.broadcast_user_joined(self.user_id)
        self.room.add_user(self.user_id, websocket)

    async def on_disconnect(self, _websocket: WebSocket, _close_code: int):
        """Disconnect the user, removing them from the :class:`~.Room`, and
        notifying the other users of their departure.
        """
        if self.user_id is None:
            raise RuntimeError(
                "RoomLive.on_disconnect() called without a valid user_id"
            )
        self.room.remove_user(self.user_id)
        await self.room.broadcast_user_left(self.user_id)

    async def on_receive(self, _websocket: WebSocket, msg: Any):
        """Handle incoming message: `msg` is forwarded straight to `broadcast_message`.
        """
        if self.user_id is None:
            raise RuntimeError("RoomLive.on_receive() called without a valid user_id")
        if not isinstance(msg, str):
            raise ValueError(f"RoomLive.on_receive() passed unhandleable data: {msg}")
        await self.room.broadcast_message(self.user_id, msg)
