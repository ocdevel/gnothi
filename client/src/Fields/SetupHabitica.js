import React, {useEffect, useState} from "react";
import {Form} from "react-bootstrap";

import {useStoreState, useStoreActions} from 'easy-peasy'
import {BasicDialog} from "../Helpers/Dialog";
import {DialogActions, DialogContent, Typography, Button} from "@material-ui/core";

function DisconnectModal({show, close}) {
  const emit = useStoreActions(a => a.ws.emit)

  function disconnect() {
    emit(['habitica/delete', {}])
    close()
  }
  return (
    <BasicDialog open={show} onClose={close} title='Disconnect Habitica'>
      <DialogContent>
        <Typography>Are you sure you want to disconnect from Habitica? Your field history will be wiped from Gnothi, and you'd
          need to start collecting from scratch again if you change your mind in the future.</Typography>
        <Typography>Consider instead <strong>removing</strong> Habitica tasks which aren't relevant to AI (remove, not delete).
          Click a field name, and click "Remove". Details in that modal.</Typography>
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={close}>Cancel</Button>
        <Button color="secondary" size='small' onClick={disconnect}>Disconnect</Button>
      </DialogActions>
    </BasicDialog>
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

      <Button type='submit' color='primary' variant="contained" size='small'>Save</Button>{' '}
      {habiticaUserId && <Button size='small' color="secondary" onClick={() => setShowModal(true)}>Disconnect</Button>}
    </Form>
  </>
}
