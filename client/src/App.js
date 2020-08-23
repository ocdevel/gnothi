import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import './App.css'
import {
  Container,
  Nav,
  Navbar,
  NavDropdown
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import Splash from './Splash'
import Journal from './Journal'
import ProfileRoutes from './ProfileRoutes'
import Error from './Error'
import moment from "moment-timezone"
import emoji from 'react-easy-emoji'
import {aiStatusEmoji} from "./utils"
import axios from 'axios'

// e52c6629: dynamic host/port
let host = window.location.host
if (~host.indexOf('gnothi')) { // prod
  host = 'https://api.gnothiai.com'
} else { // dev
  host = 'http://localhost:5002'
}

function obj2formData(object) {
    const formData = new FormData();
    Object.keys(object).forEach(key => formData.append(key, object[key]));
    return formData;
}

function App() {
  const [jwt, setJwt] = useState(localStorage.getItem('jwt'))
  const [user, setUser] = useState()
  const [as, setAs] = useState()
  const [serverError, setServerError] = useState()
  const [aiStatus, setAiStatus] = useState('off')
  // const [as, setAs] = useState('3694b314-d050-46da-882a-726598bd6abf')

  const fetch_ = async (route, method='GET', body=null) => {
    const obj = {
      method,
      headers: {'Content-Type': 'application/json'},
    };

    if (route === 'auth/jwt/login') {
      // fastapi expects formdata for auth paths
      obj['data'] = obj2formData(body)
    } else {
      if (body) obj['data'] = body
    }

    if (jwt) obj['headers']['Authorization'] = `Bearer ${jwt}`
    // auth is added by flask-jwt as /auth, all my custom paths are under /api/*
    let url = `${host}/${route}`
    if (as && user && as !== user.id) {
      url += (~route.indexOf('?') ? '&' : '?') + `as_user=${as}`
    }
    obj['url'] = url
    try {
      const {status: code, data} = await axios(obj)
      return {code, data}
    } catch (error) {
      let {status: code, statusText: message, data} = error.response
      message = data.detail || message || "There was an error"
      // Show errors, but not for 401 (we simply restrict access to components)
      if (code >= 400 && code !== 401) {
        setServerError(message)
      }
      return {code, message, data}
    }
  }

  const getUser = async () => {
    if (!jwt) {return}
    const {data, code} = await fetch_('user', 'GET')
    if (code === 401) { return logout() }
    setUser(data)

    if (!data.timezone && !as) {
       // Guess their default timezone (TODO should call this out?)
      const timezone = moment.tz.guess(true)
      fetch_('profile/timezone', 'PUT', {timezone})
    }
  }

  const onAuth = jwt_ => setJwt(jwt_)

  const checkAiStatus = () => {
    return setInterval(async () => {
      if (!jwt) {return}
      const {data, code} = await fetch_('jobs-status')
      setAiStatus(data)
    }, 1000)
  }

  useEffect(() => {
    getUser()

    const timer = checkAiStatus()
    return () => clearTimeout(timer)
  }, [jwt])

  const logout = () => {
    localStorage.removeItem('jwt')
    window.location.href = "/"
  }

  const renderAsSelect = () => {
    if (_.isEmpty(user.shared_with_me)) {return}
    return <>
      {as && (
        <NavDropdown.Item onClick={() => setAs()}>
          {emoji("🔀")}{user.email}
        </NavDropdown.Item>
      )}
      {user.shared_with_me.map(s => s.id != as && (
        <NavDropdown.Item onClick={() => setAs(s.id)}>
          {emoji("🔀")}{s.email}
        </NavDropdown.Item>
      ))}
      <NavDropdown.Divider />
    </>
  }

  const renderNav = () => {
    let email = user.email
    if (as) {
      email = _.find(user.shared_with_me, {id: as}).email
      email = <>{emoji("🕵️")} {email}</>
    }

    return (
      <Navbar bg="dark" variant="dark">
        <LinkContainer to="/">
          <Navbar.Brand>Gnothi {aiStatusEmoji(aiStatus)}</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
          </Nav>
          <Nav>
            <NavDropdown title={email} id="basic-nav-dropdown">
              {renderAsSelect()}
              <LinkContainer to="/profile/profile">
                <NavDropdown.Item>Profile</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/profile/people">
                <NavDropdown.Item>People</NavDropdown.Item>
              </LinkContainer>
              {!as && <LinkContainer to="/profile/sharing">
                <NavDropdown.Item>Sharing</NavDropdown.Item>
              </LinkContainer>}
              <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }

  if (!user) {
    return <Splash serverError={serverError} onAuth={onAuth} fetch_={fetch_} />
  }

  // key={as} triggers refresh on these components (triggering fetches)
  return (
    <Router>
      {renderNav()}
      <Container fluid key={as}>
        <Error message={serverError} />
        <Switch>
          <Route path="/j">
            <Journal
              fetch_={fetch_}
              as={as}
              setServerError={setServerError}
              aiStatus={aiStatus}
              user={user}
            />
          </Route>
          <Route path="/profile">
            <ProfileRoutes fetch_={fetch_} as={as} />
          </Route>
          <Redirect from="/" to="/j" />
        </Switch>
      </Container>
    </Router>
  )
}

export default App;
