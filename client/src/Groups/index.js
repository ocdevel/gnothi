import React, {useState, useEffect} from 'react'
import _ from 'lodash'

const websocket = new WebSocket('ws://localhost:5002/ws');

export default function Groups() {
  const [myUserId, setMyUserId] = useState(null)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [disabled, setDisabled] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "http://localhost:5002/users2");
    oReq.send();
  }, [])


  /** Add a user to the list of connected users.*/
    function addToUsersList(userId, isYou) {
      setUsers([...users, userId])
    }

    /** Clear the users list. */
    function clearUsersList() {
      setUsers([])
    }

    /** Add a user to the list of connected users and print an alert.*/
    function addUser(userId) {
        console.log('Adding user to connected users list:', userId);
        addToUsersList(userId);
        addSystemMessage(`**User ${userId}** joined the room`);
    }

    /** Remove a user from the list of connected users and print an alert.*/
    function removeUser(userId) {
        console.log('Removing user from connected users list:', userId);
        setUsers(_.without(users, userId))
        addSystemMessage(`**User ${userId}** left the room`);
    }

    /** Add a new chat message from a named user. */
    function addChatMessage(userId, msg) {
      setMessages([...messages, {userId, msg}])
    }

    /** Add a new system message (e.g. user joined/left) to the chat. */
    function addSystemMessage(msg) {
      msg.system = true
      setMessages([...messages, msg])
    }

    /** Add a new error message to the chat. */
    function addErrorMessage(msg) {
      msg.error = true
      setMessages([...messages, msg])
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
              setMyUserId(payload.data.user_id);
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


    function onSubmit(e) {
          e.preventDefault();
          if (message === '') {return}
          websocket.send(message);
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
        setDisabled(true)
    }

    /** On page load, open a websocket connection, and fetch the list of active users. */
    function reqListener () {
        const userData = JSON.parse(this.responseText);
        console.log('Received user list:', userData);
        userData.users.forEach(addToUsersList);


        websocket.onerror = onWebsocketError;
        websocket.onclose = onWebsocketClose;
        websocket.onmessage = onWebsocketMessage;
    }

  return <>
    <div className="container">
        <div id="main" className="row">
            <div className="col-md-9">
                <h4>Chat</h4>
                <div id="chatbox">
                    <div id="messages">
                      {messages.map(m => <>
                        {m.system ? <div className="alert thin-alert alert-success" role="alert">
                          {m.msg}
                        </div> : m.error ? <div className="alert thin-alert alert-danger" role="alert">
                          {m.msg}
                        </div> :
                        <div className={`alert thin-alert ${m.userId === myUserId ? 'alert-secondary' : 'alert-info'}`} role="alert">
                          <strong>{m.userId}</strong> {m.msg}
                        </div>
                        }
                      </>)}
                    </div>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="form-group row">
                        <label for="chat-input" className="col-sm-1 col-form-label">Message</label>
                        <div className="col-sm-9">
                            <input
                              type="text"
                              className="form-control"
                              id="chat-input"
                              placeholder="Enter message..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                        <div className="col-sm-2">
                            <button type="submit" className="btn btn-primary" disabled={disabled}>Send</button>
                        </div>
                    </div>
                </form>
            </div>
            <div className="col-md-3">
                <h4>Connected Users</h4>
                <ul id="users">
                  {users.map(u => <li id="users-list-' + userId + '">{u}{u === myUserId && <em> (you)</em>}</li>)}
                </ul>
            </div>
      </div>
    </div>
  </>
}
