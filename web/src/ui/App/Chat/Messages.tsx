import {useStore} from "@gnothi/web/src/data/store"
import React, {useLayoutEffect, useRef, useState} from "react";
import {timeAgo} from "@gnothi/web/src/utils/utils";
import {onlineIcon, getUname} from "../Groups/utils";
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import {yup, makeForm, TextField2} from "@gnothi/web/src/ui/Components/Form"
import Typography from "@mui/material/Typography";

const schema = yup.object({
  text: yup.string().required().min(1)
})
const useForm = makeForm(schema, {text: ''})

function ChatInput({group_id=null, entry_id=null}) {
const send = useStore(s => s.send);
  const form = useForm();

  function submit(data) {
    if (group_id) {
      send(`groups_messages_post_request`, {id: group_id, ...data})
    } else if (entry_id) {
      const body = {...data, entry_id, type: 'note'}
      send('entries_notes_post_request', body)
    }
    form.reset()
  }

  return <form onSubmit={form.handleSubmit(submit)}>
    <Grid container spacing={3} alignItems='center'>
      <Grid item sx={{flex: 1}}>
        <TextField2
          name="text"
          form={form}
          placeholder="Enter message..."
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
      {members?.[m.user_id]?.user_group?.online && onlineIcon}
      <Button variant='link'>{getUname(m.user_id, members)}</Button>
      <Typography variant='caption'>{timeAgo(m.createdAt)}</Typography>
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
  const uid = useStore(s => s.meId)
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

  const takenHeight = entry_id ? '220px' : '150px'
  return <Grid
    container
    flexDirection='column'
    sx={{height: `calc(100vh - ${takenHeight})`}}
  >

    <Grid item sx={{flex: 1, overflowY: 'scroll'}} ref={elMessages}>
      <Grid container flexDirection='column'>
        {messages?.length > 0 && messages.map(renderMessage)}
      </Grid>
    </Grid>

    <Grid item>
      <ChatInput group_id={group_id} entry_id={entry_id} />
    </Grid>

  </Grid>
}

export function GroupMessages({group_id}) {
  let messages = useStore(s => s.res.groups_messages_list_response)
  let members = useStore(s => s.res.groups_members_list_response?.hash)

  return <Messages messages={messages} members={members} group_id={group_id} />
}

export function EntriesMessages({entry_id}) {
  let messages = useStore(s => s.res.entries_notes_list_response?.hash?.[entry_id])
  let members = useStore(s => s.res?.shares_ingress_list_response?.hash)

  return <Messages messages={messages} members={members} entry_id={entry_id} />
}
