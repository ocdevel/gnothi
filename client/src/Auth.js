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

import { useSelector, useDispatch } from 'react-redux'
import { fetch_, setJwt } from './redux/actions';

function Auth() {
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  const dispatch = useDispatch();
  let location = useLocation()

  // Reset password
  let resetSuccess = location.search.match(/reset=true/i)

  const changeUsername = e => setUsername(e.target.value.toLowerCase())
  const changePassword = e => setPassword(e.target.value)
  const changePasswordConfirm = e => setPasswordConfirm(e.target.value)

  const submit_ = async (url, method, body) => {
    setError(null)
    setSubmitting(true)
    const {code, message, data} = await dispatch(fetch_(url, method, body))
    setSubmitting(false)
    console.log(code, message, data)
    if (code >= 400) {
      setError(message)
      return false
    }
    return data
  }

  const login = async () => {
    // auth/jwt/login specifically wants FormData
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const res = await submit_('auth/login', 'POST', formData)
    if (res === false) {return}
    dispatch(setJwt(res))
  }

  const submitLogin = async e => {
    e.preventDefault();
    await login()
  };

  const submitRegister = async e => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError("Password & Confirm don't match")
    }
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const res = await submit_('auth/register', 'POST', {email: username, password})
    if (res === false) {return}
    await login();
  };

  const submitForgot = async e => {
    e.preventDefault();
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const res = await submit_('auth/forgot-password', 'POST', {email: username, password})
    if (!res) {return}
    console.log(res)
  };

  const renderLogin = () => {
    return (
      <Form onSubmit={submitLogin}>
        <Form.Group controlId="formLoginEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            required
            value={username}
            onChange={changeUsername}
          />
        </Form.Group>

        <Form.Group controlId="formLoginPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={changePassword}
          />
        </Form.Group>
        {submitting ? spinner : (
          <Button variant="primary" type="submit">
            Login
          </Button>
        )}
      </Form>
    )
  };

  const renderRegister = () => {
    return (
      <Form onSubmit={submitRegister}>
        <Form.Group controlId="formRegisterEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            required
            value={username}
            onChange={changeUsername}
          />
        </Form.Group>

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
            Register
          </Button>
        )}
      </Form>
    )
  };

  const renderForgot = () => {
    return (
      <Form onSubmit={submitForgot}>
        <Form.Group controlId="formLoginEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            required
            value={username}
            onChange={changeUsername}
          />
        </Form.Group>

        {submitting ? spinner : (
          <Button variant="primary" type="submit">
            Submit
          </Button>
        )}
      </Form>
    )
  };

  return (
    <div>
      {error && <Error message={error} />}
      {resetSuccess && <Alert variant='success'>Password successfully reset, now you can log in</Alert>}
      <Tabs defaultActiveKey="login">
        <Tab eventKey="login" title="Login">
          {renderLogin()}
        </Tab>
        <Tab eventKey="register" title="Register">
          {renderRegister()}
        </Tab>
        <Tab eventKey="forgot" title="Forgot Password">
          {renderForgot()}
        </Tab>
      </Tabs>
    </div>
  )
}

function ResetPassword() {
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  const dispatch = useDispatch()
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
    const {code, message, data} = await dispatch(fetch_('auth/reset-password', 'POST', {token, password}))
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

export {Auth, ResetPassword}
