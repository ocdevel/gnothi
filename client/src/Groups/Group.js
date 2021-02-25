import {useStoreActions, useStoreState} from "easy-peasy";
import {ChatFeed, Message} from "react-chat-ui";
import {useParams} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import _ from "lodash";
import Sidebar from './Sidebar'

function Messages({messages, users}) {
  const uid = useStoreState(state => state.user.user.id)
  const el = useRef()

  useLayoutEffect(() => {
    const el_ = el.current
    if (!el_) {return}
    el_.scrollTop = el_.scrollHeight
  })

  messages = messages.map(m => new Message({
    ...m,
    id: uid === m.id ? 0 : 1,
    senderName: users[m.id] || "*system*"
  }))

  // https://github.com/brandonmowat/react-chat-ui
  // isTyping={this.state.is_typing} // Boolean: is the recipient typing
  const bubbleStyles = {
    text: {
      fontSize: 14
    },
    // chatbubble: {
    //   borderRadius: 70,
    //   padding: 40
    // }
  }

  return <div className='chat-feed' ref={el}>
      <ChatFeed
        messages={messages} // Array: list of message objects
        hasInputField={false} // Boolean: use our input, or use your own
        showSenderName // show the name of the user who sent the message
        bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
        // JSON: Custom bubble styles
        bubbleStyles={bubbleStyles}
      />
    </div>
}

export default function Group() {
  const {gid} = useParams()

  const fetch = useStoreActions(actions => actions.server.fetch)
  const [message, setMessage] = useState("")
  const messages = useStoreState(state => state.groups.messages);
  const setMessages = useStoreActions(actions => actions.groups.setMessages);
  const emit = useStoreActions(actions => actions.groups.emit);
  const group = useStoreState(state => state.groups.group)
  const fetchGroup = useStoreActions(actions => actions.groups.fetchGroup)

  useEffect(() => {
    fetchMessages()
    fetchGroup(gid)
    emit(['room', gid])
  }, [gid])

  async function fetchMessages() {
    const {data} = await fetch({route: `groups/${gid}/messages`})
    setMessages(data)
  }

  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    // socket.emit("message", {msg: message, user_id:1});
    fetch({route: `groups/${gid}/messages`, method: 'POST', body: {message}})
    setMessage('')
  }

  return <div>
    <div id="main" className="row">
      <div className="col-md-9">
        {group.id && <Messages messages={messages} users={group.members} />}
        <form onSubmit={onSubmit}>
          <div className="form-group row">
            <label htmlFor="chat-input" className="col-sm-1 col-form-label">Message</label>
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
              <button type="submit" className="btn btn-primary">Send</button>
            </div>
          </div>
        </form>
      </div>
      <div className="col-md-3">
        <Sidebar />
      </div>
    </div>
  </div>
}
