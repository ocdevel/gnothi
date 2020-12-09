import React, {useState, useEffect} from 'react'
import _ from 'lodash'
import {websocket, wsSetMessage, fetchRoom} from "../redux/actions";
import { useSelector, useDispatch } from 'react-redux'


export default function Groups() {
  const [disabled, setDisabled] = useState(false)
  const [room, setRoom] = useState()

  let users = useSelector(state => state.ws_users);
  let messages = useSelector(state => state.ws_messages);
  const message = useSelector(state => state.ws_message);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchRoom())
  }, [])

  messages = _(messages).toPairs().sortBy(o => o[0]).map(o => o[1]).value()
  users = _(users).toPairs().sortBy(o => o[1]).map(o => o[0]).value()

  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    websocket.ws.send(message);
    dispatch(wsSetMessage(''))
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
                  onChange={(e) => dispatch(wsSetMessage(e.target.value))}
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
