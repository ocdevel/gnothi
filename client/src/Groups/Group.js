import {useStoreActions, useStoreState} from "easy-peasy";
import {ChatFeed, Message} from "react-chat-ui";
import {useParams} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import _ from "lodash";
import Sidebar from './Sidebar'
import {Button, Col, Form, Row} from "react-bootstrap";
import {useSockets} from "../redux/ws";

function Messages() {
  const {gid} = useParams()

  const fetch = useStoreActions(actions => actions.server.fetch)
  const uid = useStoreState(state => state.user.user.id)
  const messages = useStoreState(state => state.groups.messages)
  const setMessages = useStoreActions(actions => actions.groups.setMessages)
  const members = useStoreState(state => state.groups.members)
  const el = useRef()

  useEffect(() => {
    fetchMessages()
  }, [gid])

  useLayoutEffect(() => {
    const el_ = el.current
    if (!el_) {return}
    el_.scrollTop = el_.scrollHeight
  })

  async function fetchMessages() {
    if (!gid) {return}
    const {data} = await fetch({route: `groups/${gid}/messages`})
    setMessages(data)
  }

  const messages_ = messages.map(m => new Message({
    ...m,
    id: uid === m.id ? 0 : 1,
    senderName: members[m.id] || "*system*"
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
        messages={messages_} // Array: list of message objects
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
  const emit = useStoreActions(actions => actions.ws.emit);
  const group = useStoreState(state => state.groups.group)
  const fetchGroup = useStoreActions(actions => actions.groups.fetchGroup)
  useSockets()

  useEffect(() => {
    emit(['groups/room', gid])
    fetchGroup(gid)
  }, [gid])


  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    // socket.emit("message", {msg: message, user_id:1});
    fetch({route: `groups/${gid}/messages`, method: 'POST', body: {message}})
    setMessage('')
  }

  return <div>
    <Row>
      <Col md={9}>
        <Messages />
        <Form onSubmit={onSubmit}>
          <Form.Group as={Row}>
            <Form.Label column sm="1">Message</Form.Label>
            <Col sm="9">
              <Form.Control
                type="text"
                placeholder="Enter message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Col>
            <div className="col-sm-2">
              <Button type="submit" variant="primary">Send</Button>
            </div>
          </Form.Group>
        </Form>
      </Col>
      <Col md={3}>
        <Sidebar />
      </Col>
    </Row>
  </div>
}
