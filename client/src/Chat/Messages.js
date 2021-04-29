import {useStoreActions, useStoreState} from "easy-peasy";
import React, {useLayoutEffect, useRef, useState} from "react";
import {timeAgo} from "../Helpers/utils";
import {onlineIcon, getUname} from "../Groups/utils";
import {useParams} from "react-router-dom";
import {useForm, Controller} from "react-hook-form";
import {Grid, TextField, Button, Alert} from '@material-ui/core'

export function Messages({messages, members, group_id=null, entry_id=null}) {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const elMessages = useRef()
  const emit = useStoreActions(actions => actions.ws.emit);
  const {reset, handleSubmit, control} = useForm()

  useLayoutEffect(() => {
    const {current} = elMessages
    if (!current) {return}
    current.scrollTop = current.scrollHeight
  }, [messages])

  function submit(data) {
    if (group_id) {
      emit([`groups/messages/post`, {id: group_id, ...data}])
    } else if (entry_id) {

    }
    reset({text: ""})
  }

  function renderMessage(m, i) {
    const me = uid === m.user_id
    const continued = i > 0 && messages[i - 1].user_id === m.user_id
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
      <form onSubmit={handleSubmit(submit)}>
        <Grid container spacing={3} alignItems='center'>
          <Grid item sx={{flex: 1}}>
            <Controller
              name="text"
              control={control}
              defaultValue=""
              rules={{ required: true, minLength: 1 }}
              render={({ field }) => (
                <TextField
                  fullWidth
                  placeholder="Enter message..."
                  {...field}
                />
              )}
            />
          </Grid>
          <Grid item>
            <Button type="submit" color="primary" variant="contained">Send</Button>
          </Grid>
        </Grid>
      </form>
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
