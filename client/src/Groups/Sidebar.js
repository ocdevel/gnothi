import {Button, Card, Col, Form, Modal, Row} from "react-bootstrap";
import {Link, useHistory, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import {useStoreActions, useStoreState} from "easy-peasy";
import _ from 'lodash'
import emoji from 'react-easy-emoji'
import {FaCrown, FaPencilAlt, FaUsers} from "react-icons/all";
import EditGroup from "./EditGroup";
import InviteMembers from "./InviteMembers";


const disabled = ['show_avatar']

function Me() {
  const {gid} = useParams()
  const history = useHistory()
  const emit = useStoreActions(actions => actions.ws.emit);
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const members = useStoreState(s => s.ws.data['groups/members/get']?.obj)
  const setSharePage = useStoreActions(s => s.user.setSharePage)

  const me = members?.[uid]
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
  if (!members?.arr?.length) {return null}
  const {arr, obj} = members

  function renderMember(m) {
    const member = obj?.[m]
    if (!member?.user?.id) {return null}
    return <li key={member.user.id}>
      <Member row={member} />
    </li>
  }

  return <><Card.Subtitle>Members</Card.Subtitle>
    <ul className="list-unstyled">
      {arr.map(renderMember)}
    </ul>
  </>
}

export default function Sidebar() {
  const {gid} = useParams()
  const group = useStoreState(s => s.ws.data['groups/group/get'])
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const [showEdit, setShowEdit] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  if (!gid) {return null}

  function toggleEdit() {setShowEdit(!showEdit)}
  function toggleInvite() {setShowInvite(!showInvite)}

  function ownerControls() {
    if (uid !== group.owner_id) {return null}
    return <div>
      <div>
        <Button
          variant='outline-secondary'
          className='w-100 mb-2'
          size='sm'
          onClick={toggleEdit}
        >
          <FaPencilAlt /> Edit Group
        </Button>
      </div>
      <div>
        <Button
          variant='outline-secondary'
          className='w-100'
          size='sm'
          onClick={toggleInvite}
        >
          <FaUsers /> Invite Members
        </Button>
      </div>
    </div>
  }

  return <div>
    {showEdit && <EditGroup show={true} close={toggleEdit} group={group} />}
    {showInvite && <InviteMembers close={toggleInvite} gid={gid} />}
    <Card className='mb-2'>
      <Card.Header>{group.title}</Card.Header>
      <Card.Body>
        <p>{group.text_short}</p>
        {ownerControls()}
        <hr />
        <Members gid={gid} />
      </Card.Body>
    </Card>

    <Me />
  </div>
}
