import {useStoreActions, useStoreState} from "easy-peasy";
import {useParams, NavLink, useRouteMatch, Link, Switch, Route} from "react-router-dom";
import React, {useEffect, useLayoutEffect, useState, useRef} from "react";
import _ from "lodash";
import Sidebar from './Sidebar'
import {Nav, Button, Card, Col, Form, Row} from "react-bootstrap";
import {EntryTeaser} from "../Entries/Entries";
import {Entry} from "../Entries/Entry";
import {LinkContainer} from 'react-router-bootstrap'
import ReactMarkdown from "react-markdown";
import {GroupMessages} from "../Chat/Messages";


function Entries() {
  const entries = useStoreState(s => s.ws.data['groups/entries/get'])
  const [eid, setEid] = useState(null)

  const {arr, obj} = entries
  if (!arr?.length) {return null}

  function onOpen(id) {
    setEid(id)
  }

  function close() {
    setEid(null)
  }

  // return <Card className='group-entries'>
  return <>
    {eid && <Entry entry={obj[eid]} close={close} />}
    <Card className='group-entries'>
      {arr.map(eid => <EntryTeaser eid={eid} gotoForm={onOpen} key={eid}/> )}
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
        <GroupMessages />
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
