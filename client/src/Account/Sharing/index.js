import {Card, Button, Form, Row, Col, ListGroup, ListGroupItem} from "react-bootstrap"
import React, {useEffect, useState} from "react"
import {Link} from 'react-router-dom'
import _ from 'lodash'
import ShareForm from './Form'
import {useStoreState, useStoreActions} from 'easy-peasy'
import {EE} from '../../redux/ws'
import {FaRegComments, FaUser} from "react-icons/fa";

function Share({share}) {
  const setSharePage = useStoreActions(a => a.user.setSharePage)
  const emails = share?.users?.length ? _.map(share.users, 'email') : null
  const groups = share?.groups?.length ? _.map(share.groups, 'title') : null
  return <Card
    className='mb-2 cursor-pointer'
    onClick={() => setSharePage({id: share.share.id})}
  >
    <Card.Body>
      {emails && <div><FaUser /> {emails.join(', ')}</div>}
      {groups && <div><FaRegComments /> {groups.join(', ')}</div>}
    </Card.Body>
  </Card>
}

export default function Sharing() {
  const emit = useStoreActions(a => a.ws.emit)
  const shares = useStoreState(s => s.ws.data['shares/shares/get'])
  const sharePage = useStoreState(s => s.user.sharePage)
  const setSharePage = useStoreActions(a => a.user.setSharePage)

  useEffect(() => {
    emit(['shares/shares/get', {}])
    EE.on("wsResponse", handleRes)
    return () => EE.off("wsResponse", handleRes)
  }, [])

  function handleRes(data) {
    if (data.action === 'shares/shares/post' && data.code === 200) {
      setSharePage({list: true})
    }
  }

  // be23b9f8: show CantSnoop. New setup uses viewer data where attempting CantSnoop

  if (sharePage.create) {
    return <ShareForm />
  }
  if (sharePage.id) {
    const s = _.find(shares, s => s.share.id === sharePage.id)
    return <ShareForm
      share_={s.share}
      tags_={s.share.tags}
      users_={_.reduce(s.users, (m, v) => ({...m, [v.email]: true}), {})}
      groups_={_.reduce(s.groups, (m, v) => ({...m, [v.id]: true}), {})}
    />
  }
  if (sharePage.list) {
    const shares_ = shares?.length && _.sortBy(shares.slice(), 'id')
    return <div>
      <Button
        variant='primary'
        onClick={() => setSharePage({create: true})}
        className='mb-2'
      >
        Share with users/groups
      </Button>
      {shares_ && shares_.map((s, i) => <Share
        key={s.share.id}
        share={s}
      />)}
    </div>
  }
}
