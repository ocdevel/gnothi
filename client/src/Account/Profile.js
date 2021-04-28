import React, {useEffect, useState} from "react"
import {
  Button,
  Form,
  Row,
  Col,
  Card,
  Alert, Modal
} from "react-bootstrap"
import {
  BsPersonFill,
  BsPeopleFill
} from "react-icons/bs"
import moment from 'moment-timezone'
import Select from 'react-select';
import _ from 'lodash'
import getZodiacSign from "./zodiac"
import People from './People'

import {useStoreState, useStoreActions} from "easy-peasy";
import {timezones} from "../redux/ws";
import {FullScreenDialog} from "../Helpers/Dialog";

function Profile_() {
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(state => state.user.as)
  const uname = useStoreState(s => s.ws.data['users/check_username'])
  const profile_ = useStoreState(s => s.ws.data['users/profile/get'])
  const [profile, setProfile] = useState({})
  const [dirty, setDirty] = useState({dirty: false, saved: false})
  const [usernameValid, setUsernameValid] = useState({checked: false, valid: null})

  useEffect(() => {
    // set the form to copy from server
    setProfile(profile_)
  }, [profile_])

  useEffect(() => {
    if (!uname) {return}
    setUsernameValid({...uname, checked: true})
  }, [uname])

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

  const changeTherapist = e => {
    setDirty({dirty: true, saved: false})
    setProfile({...profile, therapist: e.target.checked})
  }

  const submit = async e => {
    e.preventDefault()
    profile.timezone = _.get(profile, 'timezone.value', profile.timezone)
    emit(['users/profile/put', profile])
    setDirty({dirty: false, saved: true})
  }

  async function changeUsername(e) {
    setUsernameValid({checked: false, valid: null})
    changeProfile('username')(e)
  }

  async function checkUsername(e) {
    const val = e.target.value
    emit(["users/check_username", {username: val}])
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

  function usernameField() {
    const {checked, valid} = usernameValid
    const attrs = {
      onBlur: checkUsername,
      onChange: changeUsername
    }
    const children = !(profile.username && checked) ? null:
      valid ? <div className='text-success'>Valid Username</div>
      :   <div className='text-danger'>Username taken</div>
    return textField({k: 'username', v: 'Username', attrs, children})
  }

  return <div>
    <Form onSubmit={submit}>
      {usernameField()}
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
      <Form.Row>
        <Form.Group controlId="therapist">
          <Form.Check
            type="checkbox"
            label="I'm a therapist"
            checked={profile.therapist}
            onChange={changeTherapist}
          />
          <Form.Text>Check this if you want your profile listed in the therapist directory. AI will match users based on their entries to your profile based on your "About You" (bio), so be as detailed there as possible. Your name and email address will be visible to users.</Form.Text>
        </Form.Group>
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

export default function Profile({close}) {
  function renderProfile() {
    return <div>
      <div className='mb-3'>
        <Alert variant='info'>
          <div>Optionally fill out a profile.</div>
          <small className='text-muted'>You can optionally share your profile with therapists. Fields which might be important (like gender, orientation) might be used in AI. I'm still experimenting with how AI would use this stuff.</small>
        </Alert>
        <Profile_ />
      </div>
      <hr />
      <Card.Title><BsPeopleFill /> People</Card.Title>
      <Alert variant='info'>
        <div>Optionally add "who's who" in your life.</div>
        <small className='text-muted'>When sharing profile with therapists, it would help them to have a "directory" to refresh their memory. It also feeds into the AI's summaries, question-answering, etc.</small>
      </Alert>
      <People />
    </div>
  }

  return <>
    <FullScreenDialog open={true} handleClose={close} title="Profile">
      {renderProfile()}
    </FullScreenDialog>
  </>
}
