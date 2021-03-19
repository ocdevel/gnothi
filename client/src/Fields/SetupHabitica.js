import React, {useEffect, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";

import {useStoreState, useStoreActions} from 'easy-peasy'

function DisconnectModal({show, close}) {
  const emit = useStoreActions(a => a.ws.emit)

  function disconnect() {
    emit(['habitica/delete', {}])
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
  const emit = useStoreActions(actions => actions.ws.emit)
  const user = useStoreState(s => s.ws.data['users/user/get'])

  const [habiticaUserId, setHabiticaUserId] = useState(user?.habitica_user_id)
  const [habiticaApiToken, setHabiticaApiToken] = useState(user?.habitica_api_token)
  const [showModal, setShowModal] = useState(false)

  const saveHabitica = async e => {
    e.preventDefault()
    const body = {
      habitica_user_id: habiticaUserId,
      habitica_api_token: habiticaApiToken
    }
    emit(['habitica/post', body])
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
