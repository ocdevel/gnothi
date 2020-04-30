import React, {useEffect, useState} from "react"
import {
  Button,
  Form,
  Tabs,
  Tab,
  Col
} from "react-bootstrap"
import moment from 'moment-timezone'
import Select from 'react-select';
import _ from 'lodash'
import getZodiacSign from "./zodiac"

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
  const [dirty, setDirty] = useState({dirty: false, saved: false})

  const fetchProfile = async () => {
    const {data} = await fetch_("profile")
    if (!data) {return}
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
    setDirty({dirty: true, saved: false})
    const v = direct ? e : e.target.value
    setProfile({...profile, [k]: v})
  }

  const submit = async e => {
    e.preventDefault()
    profile.timezone = _.get(profile, 'timezone.value', profile.timezone)
    await fetch_('profile', 'PUT', profile)
    setDirty({dirty: false, saved: true})
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
      <Button
        disabled={!dirty.dirty}
        variant='primary'
        type='submit'
      >Save</Button>&nbsp;
      {dirty.saved && "Saved"}
    </Form>
  </div>
}
