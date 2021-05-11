import EditGroup from "./EditGroup";
import React, {useEffect, useState} from "react";
import {useHistory} from "react-router-dom";
import {useStoreActions, useStoreState} from "easy-peasy";
import {FaPlus, FaRegComments} from "react-icons/fa";
import {timeAgo} from "../Helpers/utils";
import ReactMarkdown from "react-markdown";
import {FaUsers} from "react-icons/fa";
import {BasicDialog} from "../Helpers/Dialog";
import Button from "@material-ui/core/Button";
import DialogContent from "@material-ui/core/DialogContent";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";

export function GroupModal({show, close, gid}) {
  const history = useHistory()
  const emit = useStoreActions(a => a.ws.emit)
  const group = useStoreState(s => s.ws.data['groups/groups/get']?.obj?.[gid])

  function joinGroup() {
    emit(['groups/group/join', {id: gid}])
    history.push('/groups/' + gid)
  }

  return <>
    <BasicDialog
      open={show}
      size='xl'
      onClose={close}
      title={group.title}
    >
      <DialogContent>
        <div><FaUsers /> {group.n_members} members</div>
        <div>
          <span><FaRegComments /> {group.n_messages} messages</span>
          <small className='muted ml-2'>({timeAgo(group.last_message)})</small>
        </div>
        <hr />

        <div>
          <h5>Description</h5>
          <div className='ml-2'>{group.text_short}</div>
        </div>
        {group.text_long?.length ? <div>
          <hr />
          <h5>About</h5>
          <div className='ml-2'>
            <ReactMarkdown source={group.text_long} linkTarget='_blank' />
          </div>
        </div> : null}
        <Button color='primary' variant='outlined' onClick={joinGroup}>Join Group</Button>
      </DialogContent>
    </BasicDialog>
  </>
}

export default function AllGroups() {
  const groups = useStoreState(s => s.ws.data['groups/groups/get'])
  const [showCreate, setShowCreate] = useState(false)
  const [showGroup, setShowGroup] = useState(null)

  const {arr, obj} = groups
  if (!arr?.length) {return null}

  function close() {setShowGroup(null)}

  function renderGroup(gid) {
    const g = obj[gid]
    if (!g) {return null}
    return <div key={gid}>
      <Card className='mb-2 cursor-pointer' onClick={() => setShowGroup(gid)}>
        <CardContent>
          <CardHeader title={g.title} />
          <div><FaUsers /> {g.n_members} members</div>
          <div>
            <span><FaRegComments /> {g.n_messages} messages</span>
            <small className='muted ml-2'>({timeAgo(g.last_message)})</small>
          </div>
          <hr />
          <div className='text-muted'>{g.text_short}</div>
        </CardContent>
      </Card>
    </div>
  }

  return <div>
    {showGroup && <GroupModal show={true} close={close} gid={showGroup} />}
    <EditGroup
      close={() => setShowCreate(false)}
      show={showCreate}
    />
    <Button
      color='primary'
      variant='outlined'
      gutterBottom
      onClick={() => setShowCreate(true)}
    >
      <FaPlus /> Create Group
    </Button>
    {arr.map(renderGroup)}
  </div>
}
