import {Button, Card, Col, Form, Row} from "react-bootstrap";
import {Link, useHistory, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import CreateGroup from "./CreateGroup";
import {useStoreActions, useStoreState} from "easy-peasy";
import _ from 'lodash'
import emoji from 'react-easy-emoji'
import {FaCrown} from "react-icons/all";

const privacies = [{
  k: 'username',
  v: 'Show Username',
  h: "Let members of this group see your username. By default, every group-join assigns a random name to protect your privacy. Set your username on the Profile page, otherwise it falls back to this random name."
}, {
  k: 'first_name',
  v: 'Show First Name',
  h: "Let members see your first name. Set it in Profile, else falls back to username"
}, {
  k: 'last_name',
  v: 'Show Last Name',
  h: "Let members see your last name. Set it in Profile, else falls back to first name"
}, {
  k: 'bio',
  v: 'Show Bio',
  h: "Let members see your bio (profile). Set it in Profile"
}, {
  k: 'avatar',
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

function Me() {
  const {gid} = useParams()
  const history = useHistory()
  const emit = useStoreActions(actions => actions.ws.emit);
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const membersObj = useStoreState(s => s.ws.data.membersObj)
  const setSharePage = useStoreActions(s => s.user.setSharePage)

  const me = membersObj?.[uid]
  const role = me?.user_group?.role
  const shareId = me?.share?.id

  async function joinGroup() {
    emit(["groups/group/join", {id: gid}])
  }

  async function leaveGroup() {
    emit(["groups/group/leave", {id: gid}])
    history.push("/groups")
  }

  function gotoShare() {
    if (shareId) {
      setSharePage({id: shareId})
    } else {
      setSharePage({create: true, group: gid})
    }
  }

  function renderMembership() {
    if (!role || role === 'banned') {
      return <Card.Body>Not a member
        <Button
          size='sm'
          className='float-right'
          variant='primary'
          onClick={joinGroup}
        >
          Join Group
        </Button>
      </Card.Body>
    }
    if (role === 'owner') {
      return <div>You are the owner</div>
    }
    if (role === 'member') {
      return <div>You are a member
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
  }

  function renderPrivacy() {
    if (!shareId) {
      return <div>
        <p className='small'>Your username is auto-generated (unique in each group). You can change this by sharing your info with this group. You can also share your entries (limited by specific tags) with the group, if you'd like input!</p>
        <Button
          variant='primary'
          size='sm'
          onClick={gotoShare}
        >Share with group</Button>
      </div>
    }
    const sharing = _.intersection(_.keys(me.user), _.keys(me.share))
    return <div className='small'>
      You are sharing:
      <ul>
        <li>Attributes: {sharing.join(', ')}</li>
      </ul>
      <Button
        variant='secondary'
        size='sm'
        onClick={gotoShare}
      >Modify Sharing</Button>
    </div>
  }

  return <>
    <Card.Header><Member row={me} /></Card.Header>
    <Card.Body>
      {renderMembership()}
      {/*privacies.map(p => (
        <PrivacyOpt key={`${p.k}=${p.v}`} p={p} me={me} />)
      )*/}
      {renderPrivacy()}
    </Card.Body>
  </>
}

const onlineIcon = emoji("🟢")

function Member({row}) {
  if (!row) {return null}
  const {user, user_group, share} = row
  return <>
    {user_group?.online && <span className='mr-2'>{onlineIcon}</span>}
    {user_group?.role === 'owner' && <FaCrown />}
    {user.display_name}
  </>
}

function Members() {
  const members = useStoreState(s => s.ws.data['groups/members/get'])
  return <><Card.Subtitle>Members</Card.Subtitle>
    <ul className="list-unstyled">
      {members?.map(m => m?.user?.id && <li key={m.user.id}>
        <Member row={m} />
      </li>)}
    </ul>
  </>
}

export default function Sidebar() {
  const {gid} = useParams()
  const groups = useStoreState(s => s.ws.data['groups/groups/get'])
  const group = useStoreState(s => s.ws.data['groups/group/get'])
  const [showCreate, setShowCreate] = useState(false)

  if (!gid) {return null}

  return <div>
    <CreateGroup close={() => setShowCreate(false)} show={showCreate}/>

    <Card className='mb-2'>
      <Card.Header>{group.title}</Card.Header>
      <Card.Body>
        <p>{group.text_short}</p>
        <Members />
      </Card.Body>
    </Card>

    <Card className='mb-2'>
      <Me />
    </Card>

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
