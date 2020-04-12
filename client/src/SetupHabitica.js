import React, {useEffect, useState} from "react";
import {fetch_} from "./utils";
import {Button, Form} from "react-bootstrap";

export default function Habitica({jwt}) {
  const [habiticaUserId, setHabiticaUserId] = useState('')
  const [habiticaApiToken, setHabiticaApiToken] = useState('')

  const fetchUser = async () => {
    const res = await fetch_(`user`, 'GET', null, jwt)
    setHabiticaUserId(res.habitica_user_id)
    setHabiticaApiToken(res.habitica_api_token)
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
    await fetch_(`habitica`, 'POST', body, jwt)
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
