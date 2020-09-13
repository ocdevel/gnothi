import React, {useEffect, useState} from "react";
import {Button, Form} from "react-bootstrap";

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from './redux/actions'

export default function Habitica() {
  const [habiticaUserId, setHabiticaUserId] = useState('')
  const [habiticaApiToken, setHabiticaApiToken] = useState('')

  const dispatch = useDispatch()

  // TODO use reducer.user
  const fetchUser = async () => {
    const {data} = await dispatch(fetch_(`user`, 'GET'))
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
    await dispatch(fetch_(`habitica`, 'POST', body))
    fetchUser()
  }

  const changeHabiticaUserId = e => setHabiticaUserId(e.target.value)
  const changeHabiticaApiToken = e => setHabiticaApiToken(e.target.value)

  return (
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

      <Button type='submit' variant='primary'>
        Save
      </Button>
    </Form>
  )
}
