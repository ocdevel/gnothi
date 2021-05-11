import React, {useEffect, useState} from "react";

import {useLocation, useHistory} from "react-router-dom"
import Error from './Error'
import {useStoreState, useStoreActions} from "easy-peasy";
import axios from 'axios'
import {API_URL} from "./redux/ws";
import {Box, Button} from '@material-ui/core'

import {Auth} from 'aws-amplify'
import {CircularProgress, Alert} from "@material-ui/core";
import {yup, makeForm, TextField2} from "./Helpers/Form";

const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required()
})
const useForm = makeForm(loginSchema, null, {mode: "onBlur"})

function FieldError({err}) {
  if (!err) {return null}
  return <div className='text-danger'>{err.message}</div>
}

function Login({setError, submitting}) {
  const form = useForm();
  const { register, handleSubmit, errors } = form

  async function onSubmit(form) {
    // Check old auth first
    const {data} = await axios({
      url: `${API_URL}/auth/old/login`,
      method: "POST",
      data: form
    })
    if (data.wrong) {
      return setError("Incorrect email or password")
    }
    // else notexists (let Cognito handle) or migrated (now auth them)
    try {
      await Auth.signIn(form.email, form.password);
    } catch (error) {
      setError(error.message)
    }
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <Box display='flex' flexDirection='column' gap={2}>
      <TextField2
        label='Email Address'
        type='email'
        name='email'
        form={form}
      />
      <TextField2
        label='Password'
        type='password'
        name='password'
        form={form}
      />
    </Box>

    {submitting ? <CircularProgress /> : (
      <Button variant="contained" color='primary' type="submit">
        Login
      </Button>
    )}
  </form>
}

export function Authenticate() {
  const location = useLocation()
  const fetch = useStoreActions(actions => actions.server.fetch)
  const setJwt = useStoreActions(actions => actions.user.setJwt)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function submit(url, method, body) {
    setError(null)
    setSubmitting(true)
    const {code, message, data} = await fetch({route: url, method, body})
    setSubmitting(false)
    console.log(code, message, data)
    if (code >= 400) {
      setError(message)
      return false
    }
    return data
  }

  async function login(data) {
    // auth/jwt/login specifically wants FormData
    const formData = new FormData()
    formData.append('username', data.email.toLowerCase())
    formData.append('password', data.password)
    const res = await submit('auth/login', 'POST', formData)
    if (res === false) {return}
    setJwt(res)
  }

  // Reset password
  let resetSuccess = location.search.match(/reset=true/i)

  return <div>
    {error && <Error message={error} />}
    {resetSuccess && <Alert severity='success'>Password successfully reset, now you can log in</Alert>}
    <Login
      submitting={submitting}
      submit={submit}
      setError={setError}
    />
  </div>
}

