import {useNavigate} from "react-router-dom";
import DialogContent from "@mui/material/DialogContent";
import {FaRegComments, FaUsers} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import Button from "@mui/material/Button";
import React, {useCallback} from "react";
import {useStore} from "../../../../data/store";
import {BasicDialog} from '../../../Components/Dialog'
import {timeAgo} from "../../../../utils/utils";
import {Loading} from "../../../Components/Routing";
import {shallow} from "zustand/shallow";

export function ViewModal() {
  const [
    {view, id}
  ] = useStore(s => [
    s.groups.view
  ], shallow)
  const group = useStore(s => id ? s.res.groups_list_response?.hash?.[id] : {})
  const [
    send,
    close
  ] = useStore(useCallback(s => [
    s.send,
    () => s.groups.setView({id: null, view: null})
  ], []))
  const show = Boolean(view === 'view' && id)
  const navigate = useNavigate()

  const joinGroup = useCallback(() => {
    send('groups_join_request', {id})
    navigate('/g/' + id)
  }, [id])
  
  return <>
    <BasicDialog
      open={show}
      size='xl'
      onClose={close}
      title={group?.title}
    >
      <DialogContent>
        <div><FaUsers /> {group?.n_members} members</div>
        <div>
          <span><FaRegComments /> {group?.n_messages} messages</span>
          <small className='muted ml-2'>({timeAgo(group?.last_message)})</small>
        </div>
        <hr />

        <div>
          <h5>Description</h5>
          <div className='ml-2'>{group?.text_short}</div>
        </div>
        {group?.text_long?.length ? <div>
          <hr />
          <h5>About</h5>
          <div className='ml-2'>
            <ReactMarkdown
              // FIXME replace with `components` in updated ReactMarkdonw
              // linkTarget='_blank'
            >
              {group?.text_long}
            </ReactMarkdown>
          </div>
        </div> : null}
        <Button color='primary' variant='outlined' onClick={joinGroup}>Join Group</Button>
      </DialogContent>
    </BasicDialog>
  </>
}
