import {useStoreState} from "easy-peasy";
import React, {useLayoutEffect, useRef} from "react";
import {timeAgo} from "../utils";
import {Alert, Badge, Button} from "react-bootstrap";
import {onlineIcon, getUname} from "../Groups/utils";

export function Messages({messages, members}) {
  const uid = useStoreState(s => s.ws.data['users/user/get']?.id)

  const msgs = messages.slice().reverse()

  function renderMessage(m, i) {
    const me = uid === m.user_id
    const continued = i > 0 && msgs[i - 1].user_id === m.user_id
    const float = me ? 'float-right' : 'float-left'
    const variant = me ? 'primary' : 'secondary'
    return <div>
      {!continued && <div className='clearfix'>
        <div className={`text-muted ${float}`}>
          {members[m.user_id]?.user_group?.online && onlineIcon}
          <Button variant='link'>{getUname(m.user_id, members)}</Button>
          <span className='small text-muted'>{timeAgo(m.createdAt)}</span>
        </div>
      </div>}
      <div className='clearfix'>
        <Alert variant={variant} className={`border-0 rounded-lg my-1 ${float}`}>
          {m.text}
        </Alert>
      </div>
    </div>
  }

  if (!messages?.length) {return null}
  return <div>
    {msgs.map(renderMessage)}
  </div>
}

export function GroupMessages() {
  let messages = useStoreState(s => s.ws.data['groups/messages/get'])
  let members = useStoreState(s => s.ws.data['groups/members/get']?.obj)

  return <Messages messages={messages} members={members} />
}

export function EntriesMessages() {
  let messages = useStoreState(s => s.ws.data['entries/notes/get'])
  let members = useStoreState(s => s.ws.data['shares/ingress/get']?.obj)

  return <Messages messages={messages} members={members} />
}
