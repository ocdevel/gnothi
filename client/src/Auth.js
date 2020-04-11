import React, {useEffect, useState} from "react";
import {
  Button,
  Form,
  Tab,
  Tabs
} from "react-bootstrap";
import {fetch_, spinner} from './utils'
import {Link} from "react-router-dom";

export default function Auth({onAuth}) {
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const changeUsername = e => setUsername(e.target.value)
  const changePassword = e => setPassword(e.target.value)
  const changePasswordConfirm = e => setPasswordConfirm(e.target.value)

  const login = async () => {
    const res = await fetch_('auth','POST', {username, password})
    const jwt = res.access_token;
    localStorage.setItem('jwt', jwt);
    setSubmitting(false)
    onAuth(jwt);
  }

  const submitLogin = async e => {
    // TODO switch to Axios https://malcoded.com/posts/react-http-requests-axios/
    e.preventDefault();
    setSubmitting(true)
    login()
  };

  const submitRegister = async e => {
    e.preventDefault();
    setSubmitting(true)
    // assert password = passwordConfirm. See react-bootstrap, use yup library or something for form stuff
    const res = await fetch_('register','POST',{username, password})
    login();
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
      <h1>Gnothi</h1>
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
