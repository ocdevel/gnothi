import {Badge, Button, Form} from "react-bootstrap"
import React, {useEffect, useState} from "react"
import _ from 'lodash'

const feature_map = {
  entries: 'Entries',
  summaries: 'Summaries',
  fields: 'Fields',
  themes: 'Themes',
  profile: 'Profile & Family'
}

export default function Sharing({fetch_}) {
  const [form, setForm] = useState('')
  const [shared, setShared] = useState([])

  const fetchShared = async () => {
    const {data} = await fetch_('share', 'GET')
    setShared(data)
  }

  useEffect(() => {fetchShared()}, [])

  const submit = async e => {
    e.preventDefault()
    await fetch_('share', 'POST', form)
    setForm({})
    await fetchShared()
  }

  const changeEmail = e => {
    setForm({...form, email: e.target.value})
  }

  const chooseFeature = k => e => {
    const v = e.target.checked
    setForm({...form, [k]: v})
  }

  const renderSharing = () => {
    if (_.isEmpty(shared)) {return null}
    return <>
      <hr/>
      <p>Sharing with</p>
      {shared.map(s => (
        <div>
          <Badge variant="secondary">{s.email} x</Badge><br/>
          {/*feature-selec*/}
        </div>
      ))}
    </>
  }

  return <div>
    <Form onSubmit={submit}>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          required
          placeholder="Enter email"
          value={form.email}
          onChange={changeEmail}
        />
        <Form.Text className="text-muted">
          Email of person you'll share data with
        </Form.Text>
      </Form.Group>

      <Form.Group controlId='formFeatures'>
      {_.map(feature_map, (v, k) => (
          <Form.Check
            id={`formFeature-${k}`}
            type="checkbox"
            label={v}
            value={form[k]}
            onChange={chooseFeature(k)}
          />
      ))}
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
    {renderSharing()}
  </div>
}
