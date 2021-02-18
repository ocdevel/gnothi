import React, {useEffect, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";

import {useStoreState, useStoreActions} from 'easy-peasy'

function DisconnectModal({show, close}) {
  const fetch = useStoreActions(actions => actions.server.fetch)

  const getFields = useStoreActions(actions => actions.j.getFields)
  const getUser = useStoreActions(actions => actions.user.getUser)

  const disconnect = async () => {
    await fetch({route: 'habitica', method: 'DELETE'})
    getFields()
    getUser()
    close()
  }
  return (
    <Modal show={show} onHide={close}>
      <Modal.Header>
        <Modal.Title>Disconnect Habitica</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>Are you sure you want to disconnect from Habitica? Your field history will be wiped from Gnothi, and you'd
          need to start collecting from scratch again if you change your mind in the future.</p>
        <p>Consider instead <strong>removing</strong> Habitica tasks which aren't relevant to AI (remove, not delete).
          Click a field name, and click "Remove". Details in that modal.</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" size='sm' onClick={close}>Cancel</Button>
        <Button variant="danger" size='sm' onClick={disconnect}>Disconnect</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function Habitica() {
  const fetch = useStoreActions(actions => actions.server.fetch)
  const getFields = useStoreActions(actions => actions.j.getFields)

  const [habiticaUserId, setHabiticaUserId] = useState('')
  const [habiticaApiToken, setHabiticaApiToken] = useState('')
  const [showModal, setShowModal] = useState(false)

  // TODO use reducer.user
  const fetchUser = async () => {
    const {data} = await fetch({route: `user`})
    setHabiticaUserId(data.habitica_user_id)
    setHabiticaApiToken(data.habitica_api_token)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const saveHabitica = async e => {
    e.preventDefault()
    const body = {
      habitica_user_id: habiticaUserId,
      habitica_api_token: habiticaApiToken
    }
    await fetch({route: `habitica`, method: 'POST', body})
    fetchUser()
    getFields()
  }

  const changeHabiticaUserId = e => setHabiticaUserId(e.target.value)
  const changeHabiticaApiToken = e => setHabiticaApiToken(e.target.value)

  return <>
    <DisconnectModal show={showModal} close={() => setShowModal(false)} />
    <Form onSubmit={saveHabitica}>
      <Form.Group controlId="formHabiticaUserId">
        <Form.Label>User ID</Form.Label>
        <Form.Control
          type="text"
          value={habiticaUserId}
          onChange={changeHabiticaUserId}
        />
      </Form.Group>

      <Form.Group controlId="formHabiticaApiToken">
        <Form.Label>API Key</Form.Label>
        <Form.Control
          type="text"
          value={habiticaApiToken}
          onChange={changeHabiticaApiToken}
        />
      </Form.Group>

      <Button type='submit' variant='primary' size='sm'>Save</Button>{' '}
      {habiticaUserId && <Button variant='danger' size='sm' onClick={() => setShowModal(true)}>Disconnect</Button>}
    </Form>
  </>
}
