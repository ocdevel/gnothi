import React, {useEffect, useState} from "react"
import {Button, Form, Table, Row, Col} from "react-bootstrap"
import moment from 'moment-timezone'
import Select from 'react-select';
import _ from 'lodash'
import getZodiacSign from "./zodiac"


function People({fetch, as}) {
  const [form, setForm] = useState({})
  const [family, setFamily] = useState([
    {name: 'Tyler', type: 'Self', issues: ['Depression']},
    {name: 'Susan', type: 'Mother'},
    {name: 'Robert', type: 'Father'},
  ])

  const addFamily = e => {
    e.preventDefault();
    family.push(form)
    setFamily(family)
    setForm({name: '', type: 'Self'})
  }

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }

  return <>
    <h2>Others</h2>
    <Form onSubmit={addFamily}>
      <Form.Group controlId="formFamilyName">
        <Form.Label>Family Member Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Susan"
          value={form.name}
          onChange={changeForm('name')}
        />
      </Form.Group>

      <Form.Group controlId="formFamilyType">
        <Form.Label>Family Role</Form.Label>
        <Form.Control
          as="select"
          onChange={changeForm('type')}
          value={form.type}
        >
          <option>Self</option>
          <option>Partner</option>
          <option>Mother</option>
          <option>Father</option>
          <option>Brother</option>
          <option>Sister</option>
          <option>Grandmother</option>
          <option>Grandfather</option>
          <option>Great Grandfather</option>
          <option>Great Grandmother</option>
          <option>Aunt</option>
          <option>Uncle</option>
          <option>Child</option>
          <option>Grandchild</option>
        </Form.Control>
      </Form.Group>

      <Button variant="success" type="submit">Add</Button>
    </Form>

    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>
      {family.map(f => <tr key={f.name}>
        <td>{f.name}</td>
        <td>{f.type}</td>
        <td>
          <Form.Group controlId="exampleForm.ControlSelect2">
            <Form.Control
              as="select"
              multiple
              value={f.issues}
              onChange={changeForm('issues')}
            >
              <option>Depression</option>
              <option>Alcoholism</option>
              <option>Avoidant attachment</option>
              <option>Anxious attachment</option>
              <option>Abuse</option>
              <option>Bipolar</option>
              <option>Deceased</option>
              <option>Abandonment</option>
            </Form.Control>
          </Form.Group>
        </td>
      </tr>)}
      </tbody>
    </Table>
  </>
}

const timezones = moment.tz.names().map(n => ({value: n, label: n}))

export default function Profile({fetch_, as}) {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    gender: null,
    orientation: null,
    birthday: '',
    timezone:null,
    bio: ''
  })

  const fetchProfile = async () => {
    const {data} = await fetch_("user")
    data.timezone = _.find(timezones, t => t.value === data.timezone)
    setProfile(data)
  }

  useEffect(() => {fetchProfile()}, [])

  let zodiac = null
  if (profile.birthday && profile.birthday.match(/\d{4}-\d{2}-\d{2}/)) {
    const res = profile.birthday.match(/\d{4}-(\d{2})-(\d{2})/)
    zodiac = getZodiacSign(~~res[2], ~~res[1])
  }

  const changeProfile = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setProfile({...profile, [k]: v})
  }

  const submit = async e => {
    e.preventDefault()
    profile.timezone = _.get(profile, 'timezone.value', profile.timezone)
    await fetch_('user', 'PUT', profile)
    fetchProfile()
  }

  const textField = ({k, v, attrs, children}) => (
    <Form.Group as={Col} controlId={k}>
      <Form.Label>{v}</Form.Label>
      <Form.Control
        size='sm'
        type="text"
        value={profile[k]}
        onChange={changeProfile(k)}
        {...attrs}
      />
      {children}
    </Form.Group>
  )

  return <div>
    <h2>You</h2>
    <Form onSubmit={submit}>
      <Form.Row>
        {textField({k: 'first_name', v: 'First Name'})}
        {textField({k: 'last_name', v: 'Last Name'})}
      </Form.Row>
      <Form.Row>
        {textField({k: 'gender', v: 'Gender'})}
        {textField({k: 'orientation', v: 'Orientation'})}
      </Form.Row>
      <Form.Row>
        {textField({k: 'birthday', v: 'Birthday', children: <>
          <Form.Text>YYYY-MM-DD like 1984-02-19</Form.Text>
          {zodiac && <Form.Text>{zodiac}</Form.Text>}
        </>})}
        <Form.Group as={Col} controlId="timezone">
          <Form.Label>Timezone</Form.Label>
          <Select
            value={profile.timezone}
            onChange={changeProfile('timezone', true)}
            options={timezones}
          />
        </Form.Group>
      </Form.Row>
      <Form.Row>
        {textField({k: 'bio', v: 'About You', attrs: {as: 'textarea', rows: 4}, children: <>
          <Form.Text>As much information about yourself as you can provide. This will be used by machine learning and therapists.</Form.Text>
        </>})}
      </Form.Row>
      <Button variant='primary' type='submit'>Save</Button>
    </Form>

    <People />
  </div>
}
