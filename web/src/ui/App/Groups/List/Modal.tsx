import {useNavigate} from "react-router-dom";
import DialogContent from "@mui/material/DialogContent";
import {FaRegComments, FaUsers} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import Button from "@mui/material/Button";
import React from "react";
import {useStore} from "../../../../data/store";
import {BasicDialog} from '../../../Components/Dialog'
import {timeAgo} from "../../../../utils/utils";
import {Loading} from "../../../Components/Routing";

interface Modal {
  show: boolean
  close: () => void
  gid: string
}
export default function Modal({show, close, gid}: Modal) {
  const navigate = useNavigate()
  const send = useStore(s => s.send)
  const group = useStore(s => s.res.groups_list_response?.hash?.[gid])

  function joinGroup() {
    send('groups_join_request', {id: gid})
    navigate('/groups/' + gid)
  }

  if (!group) {
    return <Loading label='groups_list_response' />
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
