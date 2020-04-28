import React, {useEffect, useState} from "react"
import {
  Button,
  Form,
  Table,
  Row,
  Tabs,
  Tab,
  Col
} from "react-bootstrap"
import moment from 'moment-timezone'
import Select from 'react-select';
import _ from 'lodash'
import getZodiacSign from "./zodiac"


function Person({fetch_, as, onSubmit=null, person=null}) {
  const default_form = {name: '', relation: '', issues: '', bio: ''}
  const [form, setForm] = useState(person ? person : default_form)

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }

  const submit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (person) {
      await fetch_(`people/${person.id}`, 'PUT', form)
    } else {
      await fetch_('people', 'POST', form)
    }
    onSubmit()
  }

  const destroy = async () => {
    if (!person) {return}
    if (window.confirm("Delete person, are you sure?")) {
      await fetch_(`people/${person.id}`, 'DELETE')
    }
    onSubmit()
  }

  const textField = ({k, v, attrs, children}) => (
    <Form.Group as={Col} controlId={k}>
      <Form.Label>{v}</Form.Label>
      <Form.Control
        readOnly={!!as}
        size='sm'
        type="text"
        value={form[k]}
        onChange={changeForm(k)}
        {...attrs}
      />
      {children}
    </Form.Group>
  )

  const req = {attrs: {required: true}}

  return <>
    <Form onSubmit={submit} className='bottom-margin'>
      <Form.Row>
        {textField({k: 'name', v: 'Name', ...req})}
        {textField({k: 'relation', v: 'Relation', ...req})}
        {textField({k: 'issues', v: 'Issues'})}
      </Form.Row>
      <Form.Row>
        {textField({k: 'bio', v: 'Bio', attrs: {as: 'textarea', cols: 3}})}
      </Form.Row>
      <Button
        variant={person ? "primary" : "success"}
        type="submit"
      >
        {person ? "Save": "Add"}
      </Button>&nbsp;
      {person && <>
        <Button size='sm' variant='secondary' onClick={onSubmit}>Cancel</Button>&nbsp;
        <Button size='sm' variant='danger' onClick={destroy}>Delete</Button>
      </>}
    </Form>
  </>
}

function People({fetch_, as}) {
  const [people, setPeople] = useState([])
  const [person, setPerson] = useState(null)

  const fetchPeople = async () => {
    const {data} = await fetch_('people')
    setPerson(null)
    setPeople(data)
  }

  useEffect(() => {fetchPeople()}, [])

  const choosePerson = p => setPerson(p)

  const onSubmit = () => {
    setPerson(null)
    fetchPeople()
  }

  return <>
    <Person
      key={person ? person.id : +new Date}
      fetch_={fetch_}
      as={as}
      onSubmit={onSubmit}
      person={person}
    />
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Relation</th>
          <th>Issues</th>
          <th>Bio</th>
        </tr>
      </thead>
      {people.map(p => (
        <tr
          className='cursor-pointer'
          onClick={() => choosePerson(p)}
          key={p.id}
        >
          <td>{p.name}</td>
          <td>{p.relation}</td>
          <td>{p.issues}</td>
          <td>{p.bio}</td>
        </tr>
      ))}
      <tbody>

      </tbody>
    </Table>
  </>
}

const timezones = moment.tz.names().map(n => ({value: n, label: n}))

function You({fetch_, as}) {
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
        readOnly={!!as}
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
  </div>
}

export default function Profile({fetch_, as}) {
  const [tab, setTab] = useState('profile');

  return (
    <Tabs
      id="controlled-tab-example"
      activeKey={tab}
      onSelect={(k) => setTab(k)}
    >
      <Tab eventKey="profile" title="Profile">
        <You fetch_={fetch_} as={as} />
      </Tab>
      <Tab eventKey="people" title="Relations">
        <People fetch_={fetch_} as={as} />
      </Tab>
    </Tabs>
  );
}
