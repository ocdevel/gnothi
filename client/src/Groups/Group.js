import {useStoreActions, useStoreState} from "easy-peasy";
import {ChatFeed, Message} from "react-chat-ui";
import {useParams, NavLink, useRouteMatch, Link, Switch, Route} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import _ from "lodash";
import Sidebar from './Sidebar'
import {Nav, Button, Card, Col, Form, Row} from "react-bootstrap";
import {EntryTeaser} from "../Entries/Entries";
import {Entry} from "../Entries/Entry";
import {LinkContainer} from 'react-router-bootstrap'
import ReactMarkdown from "react-markdown";

function Messages() {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  let messages = useStoreState(s => s.ws.data['groups/messages/get'])
  let members = useStoreState(s => s.ws.data['groups/members/get']?.obj)
  const el = useRef()

  useLayoutEffect(() => {
    const el_ = el.current
    if (!el_) {return}
    el_.scrollTop = el_.scrollHeight
  })

  messages = messages.slice().reverse().map(m => new Message({
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

function Entries() {
  const entries = useStoreState(s => s.ws.data['groups/entries/get'])
  const [eid, setEid] = useState(null)

  function onOpen(id) {
    setEid(id)
  }

  function close() {
    setEid(null)
  }

  if (!entries?.length) {return null}
  // return <Card className='group-entries'>
  return <>
    {eid && <Entry entry_id={eid} close={close} />}
    <Card className='group-entries'>
      {entries.map(e => <EntryTeaser e={e} gotoForm={onOpen} key={e.id}/> )}
    </Card>
  </>
}

export default function Group() {
  const {gid} = useParams()
  const group = useStoreState(s => s.ws.data['groups/group/get'])
  const match = useRouteMatch()
  const [message, setMessage] = useState("")
  const emit = useStoreActions(actions => actions.ws.emit);

  const {url} = match

  useEffect(() => {
    emit(['groups/group/enter', {id: gid}])
  }, [gid])


  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    emit([`groups/messages/post`, {id: gid, text: message}])
    setMessage('')
  }

  function renderNav() {
    return <Nav variant="tabs" className='mb-2'>
      <Nav.Item>
        <LinkContainer to={url} exact>
          <Nav.Link>Chat</Nav.Link>
        </LinkContainer>
      </Nav.Item>
      <LinkContainer to={`${url}/entries`}>
        <Nav.Link>Shared Entries</Nav.Link>
      </LinkContainer>
      <LinkContainer to={`${url}/about`}>
        <Nav.Link>About Group</Nav.Link>
      </LinkContainer>
    </Nav>
  }

  function renderChat() {
    return <div>
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
      <div>
        <Messages />
      </div>
    </div>
  }

  return <div>
    <Row>
      <Col md={9}>
        {renderNav()}
        <Switch>
          <Route path={url} exact>
            {renderChat()}
          </Route>
          <Route path={`${url}/entries`}>
            <Entries />
          </Route>
          <Route path={`${url}/About`}>
            <ReactMarkdown source={group.text_long} linkTarget='_blank' />
            About
          </Route>
        </Switch>
      </Col>
      <Col md={3}>
        <Sidebar />
      </Col>
    </Row>
  </div>
}
