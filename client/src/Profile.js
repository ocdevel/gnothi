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
const defaultTz = moment.tz.guess(true)

export default function Profile({fetch_, as}) {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    gender: null,
    birthday: '',
    timezone: _.find(timezones, t => t.value === defaultTz),
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

  return <div>
    <h2>You</h2>
    <Form onSubmit={submit}>
      <Form.Row>
        <Form.Group as={Col} controlId="first_name">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            size='sm'
            type="text"
            value={profile.first_name}
            onChange={changeProfile('first_name')}
          />
        </Form.Group>
        <Form.Group as={Col} controlId="last_name">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            size='sm'
            type="text"
            value={profile.last_name}
            onChange={changeProfile('last_name')}
          />
        </Form.Group>
      </Form.Row>
      <Form.Row>
        <Form.Group as={Col} controlId="gender">
          <Form.Label>Gender&nbsp;</Form.Label><br/>
          <Form.Check
            type='radio'
            label='Male'
            id='gender-male'
            inline
            checked={profile.gender==='male'}
            onChange={() => changeProfile('gender', true)('male')}
          />
          <Form.Check
            type='radio'
            id='gender-female'
            label='Female'
            inline
            checked={profile.gender==='female'}
            onChange={() => changeProfile('gender', true)('female')}
          />
          <Form.Check
            type='radio'
            id='gender-other'
            label='Other'
            inline
            checked={!~['female', 'male', null].indexOf(profile.gender)}
            onChange={() => changeProfile('gender', true)('')}
          />
          {!~['female', 'male', null].indexOf(profile.gender) && (
            <Form.Control
              size='sm'
              type="text"
              value={profile.gender}
              onChange={changeProfile('gender')}
            />
          )}
        </Form.Group>
        <Form.Group as={Col} controlId="birthday">
          <Form.Label>Birthday</Form.Label>
          <Form.Control
            size='sm'
            type="text"
            value={profile.birthday}
            onChange={changeProfile('birthday')}
          />
          <Form.Text>YYYY-MM-DD like 1984-02-19</Form.Text>
          {zodiac && <Form.Text>{zodiac}</Form.Text>}
        </Form.Group>
      </Form.Row>
      <Form.Group controlId="timezone">
        <Form.Label>Timezone</Form.Label>
        <Select
          value={profile.timezone}
          onChange={changeProfile('timezone', true)}
          options={timezones}
        />
      </Form.Group>
      <Form.Group controlId="bio">
        <Form.Label>About You</Form.Label>
        <Form.Control
          size='sm'
          as="textarea"
          rows={4}
          value={profile.bio}
          onChange={changeProfile('bio')}
        />
        <Form.Text>As much information about yourself as you can provide. This will be used by machine learning and therapists.</Form.Text>
      </Form.Group>
      <Button variant='primary' type='submit'>Save</Button>
    </Form>

    <People />
  </div>
}
