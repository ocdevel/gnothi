import React, {useState, useEffect} from 'react'
import _ from 'lodash'
import {useStoreState, useStoreActions} from "easy-peasy";
import {Row, Col, Card, Modal, Button} from 'react-bootstrap'
import { ChatFeed, Message } from 'react-chat-ui'
import {Switch, Route, useHistory, useParams, Link, Redirect} from 'react-router-dom'
import CreateGroup from "./CreateGroup";
import {useGroupsSocket} from "../redux/ws";

function Messages({messages}) {
  const uid = useStoreState(state => state.user.user.id)
  // https://github.com/brandonmowat/react-chat-ui
  // isTyping={this.state.is_typing} // Boolean: is the recipient typing
  messages = messages.map(m => new Message({
    ...m,
    // id: uid === m.id ? 0 : 1
  }))
  const bubbleStyles = {
    text: {
      fontSize: 14
    },
    // chatbubble: {
    //   borderRadius: 70,
    //   padding: 40
    // }
  }
  return  <ChatFeed
      messages={messages} // Array: list of message objects
      hasInputField={false} // Boolean: use our input, or use your own
      showSenderName // show the name of the user who sent the message
      bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
      // JSON: Custom bubble styles
      bubbleStyles={bubbleStyles}
    />
}

function Group({renderGroups}) {
  let {gid} = useParams()
  gid = gid || MAIN_GROUP
  const socket = useGroupsSocket()

  const fetch = useStoreActions(actions => actions.server.fetch)
  // TODO should I recycle .socket("/groups") (use a factory)?
  let [users, setUsers] = useState([])

  const [message, setMessage] = useState("")
  const messages = useStoreState(state => state.groups.messages);
  const setMessages = useStoreActions(actions => actions.groups.setMessages);

  const [group, setGroup] = useState({})

  async function fetchUsers(gid) {
    // const {data} = await fetch({route: `groups/{gid}/users`})
    // setUsers(data)
  }

  async function fetchMessages(gid) {
    const {data} = await fetch({route: `groups/${gid}/messages`})
    setMessages(data)
  }

  async function fetchGroup(gid) {
    const {data} = await fetch({route: `groups/${gid}`})
    setGroup(data)
  }

  useEffect(() => {
    fetchUsers(gid)
    fetchMessages(gid)
    fetchGroup(gid)
    if (socket) {
      socket.emit('room', gid)
    }
  }, [socket, gid])

  users = _(users).toPairs().sortBy(o => o[1]).map(o => o[0]).value()

  function onSubmit(e) {
    e.preventDefault();
    if (message === '') { return }
    // socket.emit("message", {msg: message, user_id:1});
    fetch({route: `groups/${gid}/messages`, method: 'POST', body: {message}})
    setMessage('')
  }

  const myUserId = false

  return <div>
    <div id="main" className="row">
      <div className="col-md-9">
        <h4>{group.title}</h4>
        <Messages messages={messages} />
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
        <h4>Connected Users</h4>
        <ul id="users">
          {users.map(u => <li id="users-list-' + userId + '">{u}{u === myUserId && <em> (you)</em>}</li>)}
        </ul>
        {renderGroups()}
      </div>
    </div>
  </div>
}

const MAIN_GROUP = 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035'

export default function Groups() {
  const fetch = useStoreActions(actions => actions.server.fetch)
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)

  async function fetchGroups() {
    const {data} = await fetch({route: 'groups'})
    setGroups(data)
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  function renderGroups() {
    return <div>
      <h4>Groups</h4>
      <Button onClick={() => setShowCreate(true)}>Create Group</Button>
      {groups.map(g => <>
        <Card>
          <Card.Title><Link to={`/groups/${g.id}`}>{g.title}</Link></Card.Title>
          <Card.Body>{g.text}</Card.Body>
        </Card>
      </>)}
    </div>
  }

  return <>
    <CreateGroup close={() => setShowCreate(false)} show={showCreate}/>
    <Switch>
      <Route path={"/groups/:gid"}>
        <Group renderGroups={renderGroups} />
      </Route>
      <Redirect from='/groups' to={`/groups/${MAIN_GROUP}`} />
    </Switch>
  </>
}
