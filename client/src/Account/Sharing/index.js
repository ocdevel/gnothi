import {Card, Button, Form, Row, Col, ListGroup, ListGroupItem} from "react-bootstrap"
import React, {useEffect, useState} from "react"
import {Link} from 'react-router-dom'
import _ from 'lodash'
import ShareForm from './Form'
import {useStoreState, useStoreActions} from 'easy-peasy'
import {EE} from '../../redux/ws'
import {FaPlus, FaRegComments, FaUser} from "react-icons/fa";
import {trueObj} from "../../utils";
import {FaArrowLeft} from "react-icons/all";

function Share({s}) {
  let myGroups = useStoreState(s => s.ws.data['groups/mine/get'])
  const setSharePage = useStoreActions(a => a.user.setSharePage)

  myGroups = myGroups?.length ? _.keyBy(myGroups, 'id') : {}

  function renderList(icon, arr, map_=_.identity) {
    arr = _.compact(arr)
    if (!arr?.length) {return null}
    return <div>{icon} {arr.map(map_).join(', ')}</div>
  }

  return <Card
    className='mb-2 cursor-pointer'
    onClick={() => setSharePage({id: s.share.id})}
  >
    <Card.Body>
      {renderList(<FaUser />, s?.users)}
      {renderList(<FaRegComments />, s?.groups, id => myGroups[id].title)}
    </Card.Body>
  </Card>
}

export default function Sharing() {
  const emit = useStoreActions(a => a.ws.emit)
  const shares = useStoreState(s => s.ws.data['shares/egress/get'])
  const sharePage = useStoreState(s => s.user.sharePage)
  const setSharePage = useStoreActions(a => a.user.setSharePage)

  useEffect(() => {
    emit(['shares/egress/get', {}])
  }, [])

  // be23b9f8: show CantSnoop. New setup uses viewer data where attempting CantSnoop

  const arr = shares?.length ? _.sortBy(shares.slice(), 'share.id') : []
  const obj = _.reduce(arr, (m, v) => ({...m, [v.share.id]: v}), {})

  return <div>
    {sharePage.list ? <Button
      variant='primary'
      onClick={() => setSharePage({create: true})}
      className='mb-2'
    >
      <FaPlus /> New Share
    </Button> : <Button
      variant='link'
      size='sm'
      onClick={() => setSharePage({list: true})}
    >
      <FaArrowLeft /> List Shares
    </Button>}
    {sharePage.create && <ShareForm />}
    {sharePage.id && <ShareForm s={obj[sharePage.id]} />}
    {sharePage.list && arr.map(s => <Share key={s.share.id} s={s}/>)}
  </div>
}
