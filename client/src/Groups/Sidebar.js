import {Button, Card, Col, Form, Row} from "react-bootstrap";
import {Link, useHistory, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import CreateGroup from "./CreateGroup";
import {useStoreActions, useStoreState} from "easy-peasy";
import _ from 'lodash'
import emoji from 'react-easy-emoji'
import {FaCrown} from "react-icons/all";

const privacies = [{
  k: 'show_username',
  v: 'Show Username',
  h: "Let members of this group see your username. By default, every group-join assigns a random name to protect your privacy. Set your username on the Profile page, otherwise it falls back to this random name."
}, {
  k: 'show_first_name',
  v: 'Show First Name',
  h: "Let members see your first name. Set it in Profile, else falls back to username"
}, {
  k: 'show_last_name',
  v: 'Show Last Name',
  h: "Let members see your last name. Set it in Profile, else falls back to first name"
}, {
  k: 'show_bio',
  v: 'Show Bio',
  h: "Let members see your bio (profile). Set it in Profile"
}, {
  k: 'show_avatar',
  v: 'Show Avatar',
  h: "Let members see your avatar. Set it in Profile"
}]

const disabled = ['show_username', 'show_avatar']

export default function Sidebar() {
  const history = useHistory()
  const {gid} = useParams()
  const fetch = useStoreActions(actions => actions.server.fetch)
  const online = useStoreState(state => state.groups.online)
  const members = useStoreState(state => state.groups.members)
  const myId = useStoreState(state => state.user.user.id)
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const group = useStoreState(state => state.groups.group)
  const fetchGroup = useStoreActions(actions => actions.groups.fetchGroup)
  const emit = useStoreActions(actions => actions.groups.emit);

  useEffect(() => {
    fetchGroups()
  }, [])

  async function fetchGroups() {
    const {data} = await fetch({route: 'groups'})
    setGroups(data)
  }

  async function joinGroup() {
    const {data} = await fetch({route: `groups/${gid}/join`, method: 'POST'})
    fetchGroup(gid)
  }

  async function leaveGroup() {
    const {data} = await fetch({route: `groups/${gid}/leave`, method: 'POST'})
    history.push("/groups")
  }

  async function onSubmit(e) {
    e.preventDefault()
  }

  const changePrivacy = key => e => {
    emit(["change_privacy", {gid, key, value: e.target.checked}])
    // () => setForm({...form, [k]: !form[k]})
  }

  const groups_ = _.filter(groups, g => g.id != gid)
  const onlineIcon = emoji("🟢")

  function renderOptions() {
    const role = _.get(members, `${myId}.role`)
    if (!role) {
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
    let el
    if (role === 'member') {
      el = <div>
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
    if (role === 'owner') {
      el = <div>
        You are the owner
      </div>
    }
    return <div>
      {el}
      {privacies.map(({k, v, h}) => <div key={k}>
        <Form.Check
          disabled={~disabled.indexOf(k)}
          checked={members[myId] && members[myId][k]}
          onChange={changePrivacy(k)}
          key={k}
          type="checkbox"
          label={v}
          name={k}
          id={`check-${k}`}
        />
        <Form.Text className='text-muted'>
          <div>{h}</div>
          {~disabled.indexOf(k)? <div className='text-warning'>This feature isn't yet available</div> : null}
        </Form.Text>
      </div>)}
    </div>
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
          {_.map(members, (member, uid) => member && <li key={uid}>
            {online[uid] && onlineIcon}
            {_.get(members, `${uid}.role`) === 'owner' && <FaCrown />}
            {member.username}
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
