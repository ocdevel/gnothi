import React, {useEffect, useState} from "react"
import {
  BsPeopleFill
} from "react-icons/bs"
import getZodiacSign from "./zodiac"
import People from './People'

import {useStore} from "@gnothi/web/src/data/store"
import {timezones} from "@gnothi/web/src/utils/utils"
import {FullScreenDialog} from "@gnothi/web/src/ui/Components/Dialog";
import DialogContent from "@mui/material/DialogContent"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import FormHelperText from "@mui/material/FormHelperText"
import {useForm, useFormState} from "react-hook-form";
import {TextField2, Checkbox2, Autocomplete2} from "@gnothi/web/src/ui/Components/Form";
import {Alert2} from "@gnothi/web/src/ui/Components/Misc"
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {CircularProgress} from '@mui/material';
import {Card, CardContent} from '@mui/material';

const schema = z.object({
  username: z.string().min(1).nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  gender: z.string().nullable(),
  birthday: z.string().nullable(),
  timezone: z.string().nullable(),
  bio: z.string().nullable(),
  therapist: z.boolean().nullable(),
  // Therapist-specific fields
  specialties: z.array(z.string()).nullable(),
  insurances: z.array(z.string()).nullable(),
  professional_bio: z.string().nullable(),
  accepting_clients: z.boolean().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  remote_sessions: z.boolean().nullable(),
  license_number: z.string().nullable(),
  license_verified: z.boolean().nullable(),
  license_verification_status: z.enum(['unverified', 'pending', 'verified']).nullable(),
  years_of_experience: z.number().nullable(),
  session_fee: z.number().nullable(),
  sliding_scale: z.boolean().nullable()
})

type ProfileFormData = z.infer<typeof schema>

function Profile_() {
  const send = useStore(s => s.send)
  const as = useStore(state => state.as)
  const uname = useStore(s => s.res.users_checkusername_response?.first)
  const profile = useStore(s => s.res.users_profile_get_response?.first)
  const [unameValid, setUnameValid] = useState({checked: false, valid: null})
  const [verificationStarted, setVerificationStarted] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: profile || {}
  })
  
  const {isDirty, isSubmitSuccessful} = useFormState({control: form.control})
  const {watch} = form
  const {register, setValue} = form
  const [birthday, username] = watch(['birthday', 'username'])

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
    send('users_profile_put_request', data)
  }

  function changeUsername(e) {
    setUnameValid({checked: false, valid: null})
  }

  function checkUsername(e) {
    if (!username?.length) {return}
    send("users_checkusername_request", {username})
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

  const therapistValue = form.watch('therapist')

  // Sample specialties and insurances for demo
  const specialtiesList = [
    'Anxiety',
    'Depression',
    'PTSD',
    'Trauma',
    'Relationships',
    'Addiction',
    'CBT',
    'DBT',
    'EMDR'
  ]

  const insurancesList = [
    'Blue Cross',
    'Aetna',
    'Cigna',
    'United Healthcare',
    'Medicare',
    'Medicaid',
    'Out of Network'
  ]

  const startVerification = () => {
    // In a real implementation, this would:
    // 1. Create a verification session with the verification provider
    // 2. Redirect to their verification flow
    // 3. Handle the callback with the verification result
    setVerificationStarted(true)
    
    // Simulate a pending state
    setTimeout(() => {
      setValue('license_verification_status', 'pending')
    }, 500)

    // Simulate a verification callback after 3 seconds
    setTimeout(() => {
      setValue('license_verification_status', 'verified')
      setValue('license_verified', true)
    }, 3000)
  }

  const renderVerificationStatus = () => {
    const status = form.watch('license_verification_status')
    const verified = form.watch('license_verified')

    if (verified) {
      return (
        <Alert2 severity="success" sx={{mt: 2}}>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            <Typography variant="body1">
              ✓ License verified by Certify™
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setValue('license_verified', false)
                setValue('license_verification_status', 'unverified')
              }}
            >
              Reverify
            </Button>
          </Box>
        </Alert2>
      )
    }

    if (status === 'pending') {
      return (
        <Alert2 severity="info" sx={{mt: 2}}>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
            <CircularProgress size={20} />
            <Typography variant="body1">
              Verifying your license with Certify™...
            </Typography>
          </Box>
        </Alert2>
      )
    }

    return (
      <Alert2 severity="warning" sx={{mt: 2}}>
        <Box>
          <Typography variant="body1" sx={{mb: 1}}>
            Your license needs to be verified before you can be listed in our therapist directory
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            We partner with Certify™, a leading healthcare credential verification service, to verify your professional license. 
            This process typically takes 1-2 business days.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={startVerification}
            disabled={verificationStarted}
          >
            Start Verification Process
          </Button>
        </Box>
      </Alert2>
    )
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

    {therapistValue && (
      <Grid container spacing={2} sx={{mt: 2}}>
        <Grid item xs={12}>
          <Typography variant="h6">Therapist Information</Typography>
        </Grid>

        {/* License Information & Verification */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{mb: 2}}>License Verification</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField2
                    name='license_number'
                    label='License Number'
                    form={form}
                    fullWidth
                    helperText="Your professional license number"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField2
                    name='state'
                    label='State of Licensure'
                    form={form}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
              {renderVerificationStatus()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Autocomplete2
            name='specialties'
            label='Specialties'
            options={specialtiesList}
            multiple
            form={form}
            helperText="Select your areas of expertise"
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete2
            name='insurances'
            label='Insurance Accepted'
            options={insurancesList}
            multiple
            form={form}
            helperText="Select insurance providers you work with"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField2
            name='professional_bio'
            label='Professional Bio'
            form={form}
            multiline
            minRows={4}
            fullWidth
            helperText="Describe your therapeutic approach, experience, and what clients can expect"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField2
            name='city'
            label='City'
            form={form}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField2
            name='state'
            label='State'
            form={form}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField2
            name='years_of_experience'
            label='Years of Experience'
            type="number"
            form={form}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField2
            name='session_fee'
            label='Session Fee ($)'
            type="number"
            form={form}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <Box>
            <Checkbox2
              label="Currently Accepting New Clients"
              name='accepting_clients'
              form={form}
            />
          </Box>
          <Box>
            <Checkbox2
              label="Offers Remote Sessions"
              name='remote_sessions'
              form={form}
            />
          </Box>
          <Box>
            <Checkbox2
              label="Offers Sliding Scale"
              name='sliding_scale'
              form={form}
            />
          </Box>
        </Grid>
      </Grid>
    )}

    <Box sx={{mt: 2}}>
      <Button
        color='primary'
        variant='contained'
        type='submit'
      >Save</Button>
      {isSubmitSuccessful && !isDirty && <FormHelperText>Saved</FormHelperText>}
    </Box>
  </form>
}

export default function Profile({close}) {
  function renderProfile() {
    return <div>
      <Alert2
        severity='info'
        title='Optionally fill out a profile.'
        noTop
      >
        You can optionally share your profile with therapists. Fields which might be important (like gender, orientation) might be used in AI. I'm still experimenting with how AI would use this stuff.
      </Alert2>
      <Profile_ />
      <Divider sx={{my: 2}}/>
      <Typography variant='h5'><BsPeopleFill /> People</Typography>
      <Alert2 severity='info' title={`Optionally add "who's who" in your life.`}>
        When sharing profile with therapists, it would help them to have a "directory" to refresh their memory. It also feeds into the AI's summaries, question-answering, etc.
      </Alert2>
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
