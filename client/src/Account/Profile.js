import React, {useEffect, useState} from "react"
import _ from 'lodash'
import {
  BsPeopleFill
} from "react-icons/bs"
import getZodiacSign from "./zodiac"
import People from './People'

import {useStoreState, useStoreActions} from "easy-peasy";
import {timezones} from "../redux/ws";
import {FullScreenDialog} from "../Helpers/Dialog";
import {
  DialogContent,
  Alert,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Divider, FormHelperText, FormGroup
} from "@material-ui/core";
import {useFormState} from "react-hook-form";
import {makeForm, yup, TextField2, Checkbox2, Autocomplete2} from "../Helpers/Form";

const schema = yup.object().shape({
  username: yup.string().min(1).nullable(),
  first_name: yup.string().nullable(),
  last_name: yup.string().nullable(),
  gender: yup.string().nullable(),
  birthday: yup.string().nullable(),
  timezone: yup.string().nullable(),
  bio: yup.string().nullable(),
  therapist: yup.bool().nullable()
})
const useForm = makeForm(schema)

function Profile_() {
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(state => state.user.as)
  const uname = useStoreState(s => s.ws.data['users/check_username'])
  const profile = useStoreState(s => s.ws.data['users/profile/get'])
  const [unameValid, setUnameValid] = useState({checked: false, valid: null})
  const form = useForm()
  const {isDirty, isSubmitSuccessful} = useFormState({control: form.control})
  const [birthday, username] = form.watch(['birthday', 'username'])

  useEffect(() => {
    // set the form to copy from server
    form.reset(profile)
  }, [profile])

  useEffect(() => {
    if (!uname) {return}
    setUnameValid({valid: uname.valid, checked: true})
  }, [uname])

  let zodiac = null
  if (birthday?.match(/\d{4}-\d{2}-\d{2}/)) {
    const res = birthday.match(/\d{4}-(\d{2})-(\d{2})/)
    zodiac = getZodiacSign(~~res[2], ~~res[1])
  }

  function submit(data) {
    emit(['users/profile/put', data])
  }

  function changeUsername(e) {
    setUnameValid({checked: false, valid: null})
  }

  function checkUsername(e) {
    if (!username?.length) {return}
    emit(["users/check_username", {username}])
  }

  function textField(name, label, props={}) {
    const {xs, sm, md, ...rest} = props

    return <Grid item xs={xs || 12} sm={sm || 6} md={md || 4}>
      <TextField2
        name={name}
        label={label}
        form={form}
        fullWidth
        readOnly={!!as}
        {...rest}
      />
    </Grid>
  }

  function usernameField() {
    const {checked, valid} = unameValid
    return textField('username', 'Username', {
      error: checked && !valid,
      helperText: !(username?.length && checked) ? null
        : valid ? 'Valid username'
          : 'Username taken',
      onBlur: checkUsername,
      onChange: changeUsername
    })
  }

  return <form onSubmit={form.handleSubmit(submit)}>
    <Grid container spacing={2}>
      {usernameField()}
      {textField('first_name', 'First Name')}
      {textField('last_name', 'Last Name')}
      {textField('gender', 'Gender')}
      {textField('orientation', 'Orientation')}
      {textField('birthday', zodiac || 'Birthday', {
        helperText: 'YYYY-MM-DD like 1984-02-19'
      })}
      <Grid item xs>
        <Autocomplete2 name='timezone' label='Timezone' options={timezones} form={form} />
      </Grid>

      {textField('bio', 'About You', {
        xs: 12, md: 12, sm: 12,
        multiline: true,
        minRows: 4,
        helperText: 'As much information about yourself as you can provide. This will be used by machine learning and therapists.'
      })}

    </Grid>

    <Box>
      <Checkbox2
        label="I'm a therapist"
        name='therapist'
        form={form}
        helperText={`Check this if you want your profile listed in the therapist directory. AI will match users based on their entries to your profile based on your "About You" (bio), so be as detailed there as possible. Your name and email address will be visible to users.`}
      />
    </Box>

    <Button
      color='primary'
      variant='contained'
      type='submit'
    >Save</Button>
    {isSubmitSuccessful && !isDirty && <FormHelperText>Saved</FormHelperText>}
  </form>
}

export default function Profile({close}) {
  function renderProfile() {
    return <div>
      <Alert severity='info' sx={{mb:2}}>
        <Typography>Optionally fill out a profile.</Typography>
        <Typography variant='caption'>You can optionally share your profile with therapists. Fields which might be important (like gender, orientation) might be used in AI. I'm still experimenting with how AI would use this stuff.</Typography>
      </Alert>
      <Profile_ />
      <Divider sx={{my: 2}}/>
      <Typography variant='h5'><BsPeopleFill /> People</Typography>
      <Alert severity='info'>
        <Typography>Optionally add "who's who" in your life.</Typography>
        <Typography variant='caption'>When sharing profile with therapists, it would help them to have a "directory" to refresh their memory. It also feeds into the AI's summaries, question-answering, etc.</Typography>
      </Alert>
      <People />
    </div>
  }

  return <>
    <FullScreenDialog open={true} onClose={close} title="Profile">
      <DialogContent>
        {renderProfile()}
      </DialogContent>
    </FullScreenDialog>
  </>
}
