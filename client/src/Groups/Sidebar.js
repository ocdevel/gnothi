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

const disabled = ['show_avatar']

function PrivacyOpt({p, me}) {
  const {h, v, k} = p
  const {gid} = useParams()
  const emit = useStoreActions(a => a.ws.emit);
  const profile = useStoreState(s => s.ws.data['users/profile/get'])

  const changePrivacy = key => e => {
    emit(["groups/privacy/put", {id: gid, key, value: e.target.checked}])
    // () => setForm({...form, [k]: !form[k]})
  }

  const unavail = ~disabled.indexOf(k)
  const unset = !profile[k.replace('show_', '')]

  const notice = unavail ? <>This feature isn't yet available</> :
    unset ? <>You haven't set this field, go to <Link to='/account/profile'>Profile</Link> to set it up</> :
    null
  return <div key={k}>
    <Form.Check
      disabled={unavail || unset}
      checked={me && me[k]}
      onChange={changePrivacy(k)}
      key={k}
      type="checkbox"
      label={v}
      name={k}
      id={`check-${k}`}
    />
    <Form.Text className='text-muted'>
      <div>{h}</div>
      {notice && <div className='text-warning'>{notice}</div>}
    </Form.Text>
  </div>
}

function Controls() {
  const {gid} = useParams()
  const history = useHistory()
  const emit = useStoreActions(actions => actions.ws.emit);
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const me = useStoreState(s => s.ws.data['groups/members/get']?.[uid] || {})

  async function joinGroup() {
    emit(["groups/group/join", {id: gid}])
  }

  async function leaveGroup() {
    emit(["groups/group/leave", {id: gid}])
    history.push("/groups")
  }

  const role = me && me.role

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
    {privacies.map(p => (
      <PrivacyOpt key={`${p.k}=${p.v}`} p={p} me={me} />)
    )}
  </div>
}

export default function Sidebar() {
  const {gid} = useParams()
  const members = useStoreState(s => s.ws.data['groups/members/get'])
  const groups = useStoreState(s => s.ws.data['groups/groups/get'])
  const group = useStoreState(s => s.ws.data['groups/group/get'])
  const [showCreate, setShowCreate] = useState(false)

  const onlineIcon = emoji("🟢")

  function renderGroup() {
    if (!gid) {return null}
    return <Card className='shadow-lg mb-5'>
      <Card.Header>
        {group.title}
      </Card.Header>
      <Card.Body>
        <p>{group.text_short}</p>
        <Card.Subtitle>Members</Card.Subtitle>
        <ul className="list-unstyled">
          {_.map(members, (member, uid) => member && <li key={uid}>
            {member.online && onlineIcon}
            {_.get(members, `${uid}.role`) === 'owner' && <FaCrown />}
            {member.username}
          </li>)}
        </ul>
        <hr />
        <Controls />
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
        {groups.map((g, i) => <div key={g.id}>
          <Card.Subtitle className='mb-2'>
            <Link to={`/groups/${g.id}`}>{g.title}</Link>
          </Card.Subtitle>
          <div className='text-muted'>{g.text_short}</div>
          {i < groups.length - 1 && <hr />}
        </div>)}
      </Card.Body>
    </Card>
  </div>
}
