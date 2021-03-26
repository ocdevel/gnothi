import {useStoreActions, useStoreState} from "easy-peasy";
import {ChatFeed, Message} from "react-chat-ui";
import {useParams} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import _ from "lodash";
import Sidebar from './Sidebar'
import {Button, Col, Form, Row} from "react-bootstrap";

function Messages() {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  let messages = useStoreState(s => s.ws.data['groups/messages/get'])
  let members = useStoreState(s => s.ws.data['groups/members/get'])
  const el = useRef()

  useLayoutEffect(() => {
    const el_ = el.current
    if (!el_) {return}
    el_.scrollTop = el_.scrollHeight
  })

  messages = messages.map(m => new Message({
    message: m.text,
    id: uid === m.user_id ? 0 : 1,
    senderName: members[m.user_id]?.username || "*system*"
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
  const [message, setMessage] = useState("")
  const emit = useStoreActions(actions => actions.ws.emit);

  useEffect(() => {
    emit(['groups/group/enter', {id: gid}])
  }, [gid])


  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    emit([`groups/messages/post`, {id: gid, text: message}])
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
