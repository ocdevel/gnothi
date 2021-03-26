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
import {API_URL} from "./redux/ws";

import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";

import {Auth} from 'aws-amplify'

const loginSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required()
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
    <Login
      submitting={submitting}
      submit={submit}
      setError={setError}
    />
  </div>
}

