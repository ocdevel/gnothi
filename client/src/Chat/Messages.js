import {useStoreActions, useStoreState} from "easy-peasy";
import React, {useLayoutEffect, useRef, useState} from "react";
import {timeAgo} from "../Helpers/utils";
import {onlineIcon, getUname} from "../Groups/utils";
import {useParams} from "react-router-dom";
import {useFormik} from 'formik'
import * as yup from 'yup';
import {Grid, TextField, Button, Alert} from '@material-ui/core'

const validationSchema = yup.object({
  text: yup.string().required().min(1)
});

function ChatInput({group_id=null, entry_id=null}) {
  const emit = useStoreActions(actions => actions.ws.emit);

  const formik = useFormik({
    initialValues: {text: '',},
    validationSchema: validationSchema,
    onSubmit: submit
  });

  function submit(data) {
    if (group_id) {
      emit([`groups/messages/post`, {id: group_id, ...data}])
    } else if (entry_id) {

    }
    formik.resetForm()
  }

  return <form onSubmit={formik.handleSubmit}>
    <Grid container spacing={3} alignItems='center'>
      <Grid item sx={{flex: 1}}>
        <TextField
          name='text'
          fullWidth
          placeholder="Enter message..."
          value={formik.values.text}
          onChange={formik.handleChange}
        />
      </Grid>
      <Grid item>
        <Button type="submit" color="primary" variant="contained">Send</Button>
      </Grid>
    </Grid>
  </form>
}

function Message({m, me, members, continued=false}) {
  return <Grid
    item
    alignSelf={me ? "flex-end" : "flex-start"}
    key={m.id}
  >
    {!continued && <div>
      <div className='text-muted'>
        {members[m.user_id]?.user_group?.online && onlineIcon}
        <Button variant='link'>{getUname(m.user_id, members)}</Button>
        <span className='small text-muted'>{timeAgo(m.createdAt)}</span>
      </div>
    </div>}
    <Alert
      icon={false}
      severity={me ? 'success' : 'info'}
      sx={{my: 1}}
    >
      {m.text}
    </Alert>
  </Grid>
}


export function Messages({messages, members, group_id=null, entry_id=null}) {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const elMessages = useRef()

  useLayoutEffect(() => {
    const {current} = elMessages
    if (!current) {return}
    current.scrollTop = current.scrollHeight
  }, [messages])

  function renderMessage(m, i) {
    const continued = i > 0 && messages[i - 1].user_id === m.user_id
    const me = uid === m.user_id
    return <Message key={m.id} m={m} members={members} me={me} continued={continued} />
  }

  return <Grid
    container
    flexDirection='column'
    sx={{height: "calc(100vh - 170px)"}}
  >

    <Grid item sx={{flex: 1, overflowY: 'scroll'}} ref={elMessages}>
      <Grid container flexDirection='column'>
        {messages?.length && messages.map(renderMessage)}
      </Grid>
    </Grid>

    <Grid item>
      <ChatInput group_id={group_id} entry_id={entry_id} />
    </Grid>

  </Grid>
}

export function GroupMessages({group_id}) {
  let messages = useStoreState(s => s.ws.data['groups/messages/get'])
  let members = useStoreState(s => s.ws.data['groups/members/get']?.obj)

  return <Messages messages={messages} members={members} group_id={group_id} />
}

export function EntriesMessages() {
  let messages = useStoreState(s => s.ws.data['entries/notes/get'])
  let members = useStoreState(s => s.ws.data['shares/ingress/get']?.obj)

  return <Messages messages={messages} members={members} />
}
