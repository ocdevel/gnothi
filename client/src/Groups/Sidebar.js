import {Button, Card} from "react-bootstrap";
import {Link, useHistory, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import CreateGroup from "./CreateGroup";
import {useStoreActions, useStoreState} from "easy-peasy";
import _ from 'lodash'
import emoji from 'react-easy-emoji'

export default function Sidebar() {
  const history = useHistory()
  const fetch = useStoreActions(actions => actions.server.fetch)
  const online = useStoreState(state => state.groups.online)
  const myId = useStoreState(state => state.user.user.id)
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const group = useStoreState(state => state.groups.group)
  const fetchGroup = useStoreActions(actions => actions.groups.fetchGroup)

  useEffect(() => {
    fetchGroups()
  }, [])

  if (!group.id) {return null}
  const gid = group.id

  async function fetchGroups() {
    const {data} = await fetch({route: 'groups'})
    setGroups(data)
  }

  async function joinGroup() {
    const {data} = await fetch({route: `groups/${gid}/join`, method: 'POST'})
    fetchGroup(group.id)
  }

  async function leaveGroup() {
    const {data} = await fetch({route: `groups/${gid}/leave`, method: 'POST'})
    history.push("/groups")
  }

  const groups_ = _.filter(groups, g => g.id != gid)
  const onlineIcon = emoji("🟢")

  function renderOptions() {
    if (!group.members[myId]) {
      return <div>
        Not a member
        <Button
          size='sm'
          className='float-right'
          variant='primary'
          onClick={joinGroup}
        >
          Join Group
        </Button>
      </div>
    }
    if (group.role === 'member') {
      return <div>
        You are a member
        <Button
          size='sm'
          className='float-right text-danger p-0'
          variant='link'
          onClick={leaveGroup}
        >
          Leave Group
        </Button>
      </div>
    }
    return <>

    </>
  }

  function renderGroup() {
    if (!gid) {return null}
    return <Card className='shadow-lg mb-5'>
      <Card.Header>
        {group.title}
      </Card.Header>
      <Card.Body>
        <p>{group.text}</p>
        <Card.Subtitle>Members</Card.Subtitle>
        <ul className="list-unstyled">
          {_.map(group.members, (uname, uid) => <li key={uid}>
            {~online.indexOf(uid) && onlineIcon}
            {uname}
          </li>)}
        </ul>
        <hr />
        {renderOptions()}
      </Card.Body>
    </Card>
  }

  return <div>
    <CreateGroup close={() => setShowCreate(false)} show={showCreate}/>

    {renderGroup()}

    <Card className='border-0'>
      <Card.Header>
        <span>
          Groups
        </span>
        <Button
          variant='link'
          size='sm'
          className='float-right p-0'
          onClick={() => setShowCreate(true)}
        >Create Group</Button>
      </Card.Header>
      <Card.Body>
        {groups_.map((g, i) => <div key={g.id}>
          <Card.Subtitle className='mb-2'>
            <Link to={`/groups/${g.id}`}>{g.title}</Link>
          </Card.Subtitle>
          <div className='text-muted'>{g.text}</div>
          {i < groups_.length - 1 && <hr />}
        </div>)}
      </Card.Body>
    </Card>
  </div>
}
