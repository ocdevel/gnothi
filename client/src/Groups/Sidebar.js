import {Button, Card} from "react-bootstrap";
import {Link, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import CreateGroup from "./CreateGroup";
import {useStoreActions} from "easy-peasy";
import _ from 'lodash'

export default function Sidebar({group}) {
  const fetch = useStoreActions(actions => actions.server.fetch)
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  if (!group) {return null}

  const gid = group.id

  async function fetchGroups() {
    const {data} = await fetch({route: 'groups'})
    setGroups(data)
  }

  async function joinGroup() {
    const {data} = await fetch({route: `groups/${gid}/join`, method: 'POST'})
  }

  const myUserId = false
  const groups_ = _.filter(groups, g => g.id != gid)

    return <div>
      <CreateGroup close={() => setShowCreate(false)} show={showCreate}/>

      <Card className='shadow-lg mb-5'>
        <Card.Header>
          {group.title}
          <span
            className='text-primary pointer float-right'
            onClick={joinGroup}
          >
            Join Group
          </span>
        </Card.Header>
        <Card.Body>
          <p>{group.text}</p>
          <Card.Subtitle>Members</Card.Subtitle>
          <ul id="users">
            {_.map(group.members, u => <li id="users-list-' + userId + '">{u}</li>)}
          </ul>
        </Card.Body>
      </Card>

      <Card className='border-0'>
        <Card.Header>
          Groups
          <span
            className='text-primary pointer float-right'
            onClick={() => setShowCreate(true)}
          >Create Group</span>
        </Card.Header>
        <Card.Body>
          {groups_.map((g, i) => <>
            <Card.Subtitle className='mb-2'>
              <Link to={`/groups/${g.id}`}>{g.title}</Link>
            </Card.Subtitle>
            <div className='text-muted'>{g.text}</div>
            {i < groups_.length - 1 && <hr />}
          </>)}
        </Card.Body>
      </Card>
    </div>
}
