import React, {useEffect, useState} from "react";
import {
  Button,
  Form,
  Tab,
  Tabs,
  Alert
} from "react-bootstrap";
import {useLocation, useHistory} from "react-router-dom"
import Error from './Error'
import {spinner} from './utils'
import {useStoreState, useStoreActions} from "easy-peasy";
import axios from 'axios'

import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";

import {Auth} from 'aws-amplify'

const email = yup.string().email().required()
const password = yup.string().required() // TODO validate based on Cognito
const forgotPassSchema = yup.object().shape({email})
const loginSchema = yup.object().shape({email, password})
const registerSchema = yup.object().shape({
  email, password,
  passwordConfirm: yup.string().required()
    .test('passwords-match', 'Passwords must match', function(value){
      return this.parent.password === value
    })
})

function FieldError({err}) {
  if (!err) {return null}
  return <div className='text-danger'>{err.message}</div>
}

function Login({setError, submitting}) {
  const { register, handleSubmit, errors } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onBlur"
  });

  async function tryOldSystem(data, cognitoError) {
    try {
      const res = await axios({
        url: "http://localhost:5002/auth/old/verify",  // FIXME server url
        method: "POST",
        data
      })
      // User never registered
      console.log(res)
      if (!res.data.exists) {
        setError(cognitoError.message)
        return
      // User is in the old system, but didn't use the right password
      }
      if (!res.data.verified) {
        setError("Incorrect password")
        return
      // User is in the old system and has been migrated over
      }
      // User was migrated on the server, so now try again
      await Auth.signIn(data.email, data.password);
    } catch (error) {
      console.log(error)
      setError(error.message)
      debugger
    }
  }

  async function onSubmit(data) {
    try {
      const user = await Auth.signIn(data.email, data.password);
    } catch (error) {
      if (error.code === "NotAuthorizedException") {
        // invalid email/username, check first if part of old system. If
        // so, we'll migrate them to Cognito.
        await tryOldSystem(data, error)
      } else {
        setError(error.message)
      }
    }
  }

  return <Form onSubmit={handleSubmit(onSubmit)}>
    <Form.Group controlId="loginEmail">
      <Form.Label>Email address</Form.Label>
      <Form.Control
        name="email"
        type="email"
        placeholder="Enter email"
        required
        ref={register}
      />
      <FieldError err={errors.email} />
    </Form.Group>

    <Form.Group controlId="loginPassword">
      <Form.Label>Password</Form.Label>
      <Form.Control
        name="password"
        type="password"
        placeholder="Password"
        required
        ref={register}
      />
      <FieldError err={errors.password} />
    </Form.Group>
    {submitting ? spinner : (
      <Button variant="primary" type="submit">
        Login
      </Button>
    )}
  </Form>
}

function Register({login, submit, setError, submitting}) {
  const { register, handleSubmit, errors } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onBlur"
  });

  async function onSubmit(data) {
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    data['email'] = data.email.toLowerCase()
    const res = await submit('auth/register', 'POST', data)
    if (res === false) {return}
    await login(data);
  }

  return <Form onSubmit={handleSubmit(onSubmit)}>
    <Form.Group controlId="formRegisterEmail">
      <Form.Label>Email address</Form.Label>
      <Form.Control
        name="email"
        type="email"
        placeholder="Enter email"
        required
        ref={register}
      />
      <FieldError err={errors.email} />
    </Form.Group>

    <Form.Group controlId="formRegisterPassword">
      <Form.Label>Password</Form.Label>
      <Form.Control
        name="password"
        type="password"
        placeholder="Password"
        required
        ref={register}
      />
      <FieldError err={errors.password} />
    </Form.Group>
    <Form.Group controlId="formRegisterPasswordConfirm">
      <Form.Label>Confirm Password</Form.Label>
      <Form.Control
        name="passwordConfirm"
        type="password"
        placeholder="Confirm Password"
        required
        ref={register}
      />
      <FieldError err={errors.passwordConfirm} />
    </Form.Group>
    {submitting ? spinner : (
      <Button variant="primary" type="submit">
        Register
      </Button>
    )}
  </Form>
}

function Forgot({submitting, submit}) {
  const { register, handleSubmit, errors } = useForm({
    resolver: yupResolver(forgotPassSchema),
    mode: "onBlur"
  });

  async function onSubmit(data) {
    const res = await submit('auth/forgot-password', 'POST', data)
    if (!res) {return}
  }

  return <Form onSubmit={handleSubmit(onSubmit)}>
    <Form.Group controlId="formLoginEmail">
      <Form.Label>Email address</Form.Label>
      <Form.Control
        name="email"
        type="email"
        placeholder="Enter email"
        required
        ref={register}
      />
      <FieldError err={errors.email} />
    </Form.Group>

    {submitting ? spinner : (
      <Button variant="primary" type="submit">
        Submit
      </Button>
    )}
  </Form>
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
    {resetSuccess && <Alert variant='success'>Password successfully reset, now you can log in</Alert>}
    <Tabs defaultActiveKey="login">
      <Tab eventKey="login" title="Login">
        <Login
          submitting={submitting}
          submit={submit}
          setError={setError}
        />
      </Tab>
      <Tab eventKey="register" title="Register">
        <Register
          login={login}
          submitting={submitting}
          submit={submit}
          setError={setError}
        />
      </Tab>
      <Tab eventKey="forgot" title="Forgot Password">
        <Forgot
          submitting={submitting}
          submit={submit}
        />
      </Tab>
    </Tabs>
  </div>
}

export function ResetPassword() {
  const as = useStoreState(state => state.user.as)
  const fetch = useStoreActions(actions => actions.server.fetch)

  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  const history = useHistory()
  let location = useLocation()

  // Reset password
  let token = location.search.match(/token=(.*)/i)
  token = token && token[1]

  const changePassword = e => setPassword(e.target.value)
  const changePasswordConfirm = e => setPasswordConfirm(e.target.value)

  const submit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError("Password & Confirm don't match")
    }
    setError(null)
    setSubmitting(true)
    const {code, message, data} = await fetch({route: 'auth/reset-password', method: 'POST', body: {token, password}})
    setSubmitting(false)
    if (code !== 200) {
      setError(message)
      return false
    }
    history.push('/auth?reset=true')
  }

  return <>
    <h1>Reset Password</h1>
    <Form onSubmit={submit}>
      {error && <Error message={error} />}
      <Form.Group controlId="formRegisterPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={changePassword}
        />
      </Form.Group>
      <Form.Group controlId="formRegisterPasswordConfirm">
        <Form.Label>Confirm Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Confirm Password"
          required
          value={passwordConfirm}
          onChange={changePasswordConfirm}
        />
      </Form.Group>
      {submitting ? spinner : (
        <Button variant="primary" type="submit">
          Submit
        </Button>
      )}
    </Form>
  </>
}
