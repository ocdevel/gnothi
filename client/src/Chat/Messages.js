import {useStoreActions, useStoreState} from "easy-peasy";
import React, {useLayoutEffect, useRef, useState} from "react";
import {timeAgo} from "../Helpers/utils";
import {Alert, Badge, Button, Col, Form, Row} from "react-bootstrap";
import {onlineIcon, getUname} from "../Groups/utils";
import {useParams} from "react-router-dom";
import {useForm} from "react-hook-form";

export function Messages({messages, members, group_id=null, entry_id=null}) {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)
  const elWrapper = useRef()
  const elMessages = useRef()
  const emit = useStoreActions(actions => actions.ws.emit);
  const form = useForm()

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
    form.reset({text: ""})
  }

  function renderInput() {
    return <Form onSubmit={form.handleSubmit(submit)}>
      <Form.Group as={Row}>
        <Form.Label column sm="1">Message</Form.Label>
        <Col sm="9">
          <Form.Control
            {...form.register('text', {required: true, minLength: 1})}
            type="text"
            placeholder="Enter message..."
          />
        </Col>
        <div className="col-sm-2">
          <Button type="submit" variant="primary">Send</Button>
        </div>
      </Form.Group>
    </Form>
  }

  function renderMessage(m, i) {
    const me = uid === m.user_id
    const continued = i > 0 && messages[i - 1].user_id === m.user_id
    return <div key={m.id} className={me ? 'message-mine' : 'message-theirs'}>
      {!continued && <div>
        <div className='text-muted'>
          {members[m.user_id]?.user_group?.online && onlineIcon}
          <Button variant='link'>{getUname(m.user_id, members)}</Button>
          <span className='small text-muted'>{timeAgo(m.createdAt)}</span>
        </div>
      </div>}
      <Alert
        variant={me ? 'primary' : 'secondary'}
        className={`border-0 rounded-lg my-1`}
      >
        {m.text}
      </Alert>
    </div>
  }

  return <div ref={elWrapper} className='chat-wrapper'>
    <div ref={elMessages} className='chat-messages'>
      {messages?.length && messages.map(renderMessage)}
    </div>
    <div className='chat-input border-top'>
      {renderInput()}
    </div>
  </div>
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
