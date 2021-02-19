import React, {useState, useEffect} from 'react'
import _ from 'lodash'
import {useStoreState, useStoreActions} from "easy-peasy";
import {useSocket} from "../redux/ws";


export default function Groups() {
  const socket = useSocket().socket("/groups")
  const [disabled, setDisabled] = useState(false)
  const [room, setRoom] = useState()

  const fetch = useStoreActions(actions => actions.server.fetch)
  let users = useStoreState(state => state.ws.users);
  let messages = useStoreState(state => state.ws.messages);
  const message = useStoreState(state => state.ws.message);
  const actions = useStoreActions(actions => actions.ws)

  async function fetchRoom() {
    const {data} = await fetch({route: 'users2'})
    data.users.forEach(actions.addToUsersList)
    socket.on('message', onMessage)
    socket.on('error', onMessage)
    socket.on('room_kick', onRoomKick)
    socket.on('user_join', onUserJoin)
    socket.on('user_leave', onUserLeave)
    socket.on('room_join', onRoomJoin)
  }

  useEffect(() => {
    fetchRoom()
  }, [])

  function onUserJoin(data) {
    actions.addToUsersList(data)
    actions.addMessage({msg: `**User ${data}** joined the room`, user_id: 'server'})
  }

  function onUserLeave(data) {
    actions.addMessage({msg: `**User ${data}** left the room`, user_id: 'server'})
  }

  function onRoomJoin(data) {
    actions.addToUsersList(data.user_id);
  }

  function onRoomKick(data) {
    actions.setUsers({})
  }

  function onMessage(data) {
      const {msg, user_id} = data
      actions.addMessage({msg, user_id})
  }

  messages = _(messages).toPairs().sortBy(o => o[0]).map(o => o[1]).value()
  users = _(users).toPairs().sortBy(o => o[1]).map(o => o[0]).value()

  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    socket.emit("message", {msg: message, user_id:1});
    actions.setMessage('')
  }

  const myUserId = false

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
                  <div className={`alert thin-alert ${m.user_id === myUserId ? 'alert-secondary' : 'alert-info'}`}
                       role="alert">
                    <strong>{m.user_id}</strong> {m.msg}
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
                  onChange={(e) => actions.setMessage(e.target.value)}
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
