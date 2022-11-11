import {Link, useNavigate, useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import {useStore} from "../../../../data/store"
import _ from 'lodash'
import {FaBan, FaCrown} from "react-icons/fa";
import Edit from "./Edit";
import InviteMembers from "./InviteMembers";
import {FaTrash} from "react-icons/fa";
import {onlineIcon} from "../utils";
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import {Stack2} from "../../../Components/Misc";

import GroupIcon from '@mui/icons-material/Group';
import CreateIcon from '@mui/icons-material/Create';


const disabled = ['show_avatar']

function Me() {
  const {gid} = useParams()
  const navigate = useNavigate()
  const send = useStore(s => s.send);
  const uid = useStore(s => s.user.me?.id)
  const members = useStore(s => s.res.groups_members_list_response?.hash)
  const setSharePage = useStore(s => s.setSharePage)

  const me = members?.[uid]
  const role = me?.user_group?.role
  const shareId = me?.share?.id

  async function joinGroup() {
    send("groups_join_request", {id: gid})
  }

  async function leaveGroup() {
    send("groups_leave_request", {id: gid})
    navigate("/groups")
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
      return <>
        <Typography>Not a member</Typography>
        <Button
          size='small'
          variant='outlined'
          color='primary'
          onClick={joinGroup}
        >
          Join Group
        </Button>
      </>
    }
    if (role === 'owner') {
      return <Typography>You are the owner</Typography>
    }
    if (role === 'member') {
      return <>
      <Typography>You are a member</Typography>
      <Button
        size='small'
        variant='outlined'
        color='secondary'
        onClick={leaveGroup}
      >
        Leave Group
      </Button>
    </>
    }
  }

  function renderPrivacy() {
    if (!shareId) {
      return <>
        <Typography variant='body2'>Your username is auto-generated (unique in each group). You can change this by sharing your info with this group. You can also share your entries (limited by specific tags) with the group, if you'd like input!</Typography>
        <Button
          color='primary'
          variant='contained'
          size='small'
          onClick={gotoShare}
        >Share with group</Button>
      </>
    }
    const sharing = _.intersection(_.keys(me.user), _.keys(me.share))
    return <>
      <div>
        <Typography>You are sharing:</Typography>
        <Typography variant='body2'>Attributes: {sharing.join(', ')}</Typography>
      </div>
      <Button
        variant='outlined'
        color='primary'
        size='small'
        onClick={gotoShare}
      >Modify Sharing</Button>
    </>
  }

  return <>
    <CardHeader title="Membership" />
    <CardContent sx={{pt:0}}>
      <Stack2>
        <Typography><Member row={me} /></Typography>
        {renderMembership()}
        {renderPrivacy()}
      </Stack2>
    </CardContent>
  </>
}

function Member({row, isOwner, gid}) {
const send = useStore(s => s.send)
  if (!row) {return null}
  const {user, user_group, share} = row

  function remove() {
    send('groups_members_put_request', {remove: true, id: gid, user_id: user.id})
  }
  function ban() {
    send('groups_members_put_request', {id: gid, user_id: user.id, role: 'banned'})
  }

  return <div className='group-sidebar-member'>
    {user_group?.online && <span className='mr-2'>{onlineIcon}</span>}
    {user_group?.role === 'owner' && <FaCrown />}
    {user.display_name}
    {isOwner && <span className='member-controls'>
      <Button
        variant='link'
        color='secondary'
        size='small'
        onClick={remove}
        startIcon={<FaTrash />}
      >
        Remove
      </Button>
      <Button
        variant='link'
        color='secondary'
        size='small'
        onClick={ban}
        startIcon={<FaBan />}
      >
        Ban
      </Button>
    </span>}
  </div>
}

function Members({gid, isOwner}) {
  const members = useStore(s => s.res.groups_members_list_response)
  if (!members?.ids?.length) {return null}
  const {ids, hash} = members

  function renderMember(mid) {
    const member = hash?.[mid]
    if (!member?.user?.id) {return null}
    return <div key={member.user.id}>
      <Member row={member} isOwner={isOwner} gid={gid} />
    </div>
  }

  return <>
    <CardHeader title="Members"/>
    <CardContent sx={{pt:0}}>
      <div>
        {ids.map(renderMember)}
      </div>
    </CardContent>
  </>
}

export default function Sidebar() {
  const {gid} = useParams()
  const group = useStore(s => s.res.groups_list_response)
  const uid = useStore(s => s.user?.me?.id)
  const [showEdit, setShowEdit] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  if (!gid) {return null}
  const isOwner = uid === group.owner_id

  function toggleEdit() {setShowEdit(!showEdit)}
  function toggleInvite() {setShowInvite(!showInvite)}

  function ownerControls() {
    if (!isOwner) {return null}
    return <>
      <Button
        variant='outlined'
        onClick={toggleEdit}
        startIcon={<CreateIcon />}
      >
        Edit Group
      </Button>
      <Button
        variant='outlined'
        onClick={toggleInvite}
        startIcon={<GroupIcon />}
      >
        Invite Members
      </Button>
    </>
  }

  return <div>
    {showEdit && <Edit show={true} close={toggleEdit} group={group} />}
    {showInvite && <InviteMembers close={toggleInvite} gid={gid} />}
    <Card>
      <CardHeader
        title={group.title}
        subheader={group.text_short}
        sx={{pb:0}}
      />
      <CardContent>
        <Stack2>
          {ownerControls()}
        </Stack2>
      </CardContent>
      <Members gid={gid} isOwner={isOwner} />
      <Me />
    </Card>
  </div>
}
