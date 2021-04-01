import {Button, Card, Col, Form, Row} from "react-bootstrap";
import {Link, useHistory, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import {useStoreActions, useStoreState} from "easy-peasy";
import _ from 'lodash'
import emoji from 'react-easy-emoji'
import {FaCrown, FaPencilAlt} from "react-icons/all";
import {DEFAULT_IDS} from "../utils";
import EditGroup from "./EditGroup";


const disabled = ['show_avatar']

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

  return <Card className='mb-2'>
    <Card.Header><Member row={me} /></Card.Header>
    <Card.Body>
      {renderMembership()}
      {renderPrivacy()}
    </Card.Body>
  </Card>
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

function Members({gid}) {
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
  const group = useStoreState(s => s.ws.data['groups/group/get'])
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const [showEdit, setShowEdit] = useState(false)

  if (!gid) {return null}

  function toggle() {setShowEdit(!showEdit)}

  return <div>
    {showEdit && <EditGroup show={true} close={toggle} group={group} />}
    <Card className='mb-2'>
      <Card.Header>{group.title}</Card.Header>
      <Card.Body>
        <p>{group.text_short}</p>
        {uid === group.owner_id && <Button
          variant='outline-secondary'
          size='sm'
          onClick={toggle}
        >
          <FaPencilAlt /> Edit Group
        </Button>}
        <hr />
        <Members gid={gid} />
      </Card.Body>
    </Card>

    <Me />
  </div>
}
