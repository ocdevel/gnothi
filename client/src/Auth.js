import React, {useEffect, useState} from "react";
import {
  Button,
  Form,
  Tab,
  Tabs
} from "react-bootstrap";
import Error from './Error'
import {spinner} from './utils'

export default function Auth({fetch_, onAuth}) {
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  const changeUsername = e => setUsername(e.target.value)
  const changePassword = e => setPassword(e.target.value)
  const changePasswordConfirm = e => setPasswordConfirm(e.target.value)

  const login = async () => {
    const {access_token, code} = await fetch_('auth/token', 'POST', {username, password})
    localStorage.setItem('jwt', access_token);
    setSubmitting(false)
    onAuth(access_token);
  }

  const submitLogin = async e => {
    e.preventDefault();
    setError(null)
    setSubmitting(true)
    login()
  };

  const submitRegister = async e => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError("Password & Confirm don't match")
    }
    setError(null)
    setSubmitting(true)
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const {message, code} = await fetch_('register', 'POST', {username, password})
    if (code !== 200) {
      setSubmitting(false)
      return setError(message)
    }
    await login();
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

  return (
    <div>
      {error && <Error message={error} />}
      <Tabs defaultActiveKey="login">
        <Tab eventKey="login" title="Login">
          {renderLogin()}
        </Tab>
        <Tab eventKey="register" title="Register">
          {renderRegister()}
        </Tab>
      </Tabs>
    </div>
  )
}
