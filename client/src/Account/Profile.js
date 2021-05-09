import React, {useEffect, useState} from "react"
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
  FormControlLabel,
  Checkbox, FormHelperText, FormControl, FormGroup, Autocomplete, Divider
} from "@material-ui/core";
import {useFormik} from "formik"
import * as yup from "yup";

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

function Profile_() {
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(state => state.user.as)
  const uname = useStoreState(s => s.ws.data['users/check_username'])
  const profile_ = useStoreState(s => s.ws.data['users/profile/get'])
  const [usernameValid, setUsernameValid] = useState({checked: false, valid: null})
  const [dirty, setDirty] = useState({dirty: false, saved: false})
  const formik = useFormik({
    initialValues: profile_,
    validationSchema: schema,
    onSubmit: submit
  })
  const {values: profile, errors} = formik

  useEffect(() => {
    // set the form to copy from server
    formik.setValues(profile_)
  }, [profile_])

  useEffect(() => {
    if (!uname) {return}
    setUsernameValid({...uname, checked: true})
  }, [uname])

  let zodiac = null
  if (profile?.birthday?.match(/\d{4}-\d{2}-\d{2}/)) {
    const res = profile.birthday.match(/\d{4}-(\d{2})-(\d{2})/)
    zodiac = getZodiacSign(~~res[2], ~~res[1])
  }

  function submit(data) {
    emit(['users/profile/put', profile])
    setDirty({dirty: false, saved: true})
  }

  function changeUsername(e) {
    setUsernameValid({checked: false, valid: null})
    handleChange(e)
  }

  function checkUsername(e) {
    const {username} = profile
    // debugger
    if (!username?.length) {return}
    emit(["users/check_username", {username}])
  }

  function handleChange(e) {
    setDirty({dirty: true, saved: false})
    formik.handleChange(e)
  }

  function handleChangeTz(e, val) {
    setDirty({dirty: true, saved: false})
    formik.setFieldValue('timezone', val)
  }

  function textField(name, label, props={}) {
    const {xs, sm, md, ...rest} = props

    return <Grid item xs={xs || 12} sm={sm || 6} md={md || 4}>
      <TextField
        error={errors?.[name]}
        helperText={errors?.[name]}
        name={name}
        label={label}
        value={profile[name]}
        fullWidth
        readOnly={!!as}
        onChange={handleChange}
        {...rest}
      />
    </Grid>
  }

  function usernameField() {
    const {checked, valid} = usernameValid

    return textField('username', 'Username', {
      error: checked && !valid,
      helperText: !(profile.username && checked) ? null
        : valid ? 'Valid username'
          : 'Username taken',
      onBlur: checkUsername,
      onChange: changeUsername
    })
  }

  return <form onSubmit={formik.handleSubmit}>
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
        <Autocomplete
          disablePortal
          name='timezone'
          value={profile.timezone}
          onChange={handleChangeTz}
          fullWidth
          options={timezones}
          renderInput={(params) => <TextField
            {...params}
            label="Timezone"
          />}
        />
      </Grid>

      {textField('bio', 'About You', {
        xs: 12, md: 12, sm: 12,
        multiline: true,
        minRows: 4,
        helperText: 'As much information about yourself as you can provide. This will be used by machine learning and therapists.'
      })}

    </Grid>

    <Box>
      <FormControl>
        <FormControlLabel
          label="I'm a therapist"
          control={<Checkbox
            checked={profile.therapist}
            name='therapist'
            onChange={handleChange}
          />}
        />
        <FormHelperText>Check this if you want your profile listed in the therapist directory. AI will match users based on their entries to your profile based on your "About You" (bio), so be as detailed there as possible. Your name and email address will be visible to users.</FormHelperText>
      </FormControl>
    </Box>

    <Button
      disabled={!dirty.dirty}
      color='primary'
      variant='contained'
      type='submit'
    >{dirty.saved ? "Saved" : "Save"}</Button>
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
