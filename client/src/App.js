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
  Redirect
} from "react-router-dom";
import Auth from './Auth'
import Journal from './Journal'
import ProfileRoutes from './ProfileRoutes'
import Error from './Error'
import moment from "moment-timezone"
import emoji from 'react-easy-emoji'
import {aiStatusEmoji} from "./utils"

// e52c6629: dynamic host/port
let host = window.location.host
if (~host.indexOf('gnothi')) { // prod
  host = 'https://api.gnothiai.com'
} else { // dev
  host = 'http://localhost:5002'
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
    if (body) obj['body'] = JSON.stringify(body)
    if (jwt) obj['headers']['Authorization'] = `JWT ${jwt}`
    // auth is added by flask-jwt as /auth, all my custom paths are under /api/*
    let url = route === 'auth' ? `${host}/${route}` :
      `${host}/api/${route}`
    if (as && user && as !== user.id) {
      url += (~route.indexOf('?') ? '&' : '?') + `as=${as}`
    }
    let res = await fetch(url, obj)
    const code = res.status
    res = await res.json()
    // Show errors, but not for 401 (we simply restrict access to components)
    if (code >= 400 && code != 401) {
      setServerError(res.message || "There was an error")
    }
    return {...res, code}
  }

  const getUser = async () => {
    if (!jwt) {return}
    const {data, code} = await fetch_('user', 'GET')
    if (code === 401) { return logout() }
    setUser(data)

    if (!data.timezone && !as) {
       // Guess their default timezone (TODO should call this out?)
      const timezone = moment.tz.guess(true)
      fetch_('profile', 'PUT', {timezone})
    }
  }

  const onAuth = jwt_ => setJwt(jwt_)

  const checkAiStatus = () => {
    return setInterval(async () => {
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
          {emoji("🔀")}{user.username}
        </NavDropdown.Item>
      )}
      {user.shared_with_me.map(s => s.id != as && (
        <NavDropdown.Item onClick={() => setAs(s.id)}>
          {emoji("🔀")}{s.username}
        </NavDropdown.Item>
      ))}
      <NavDropdown.Divider />
    </>
  }

  const renderNav = () => {
    let username = user.username
    if (as) {
      username = _.find(user.shared_with_me, {id: as}).username
      username = <>{emoji("🕵️")} {username}</>
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
            <NavDropdown title={username} id="basic-nav-dropdown">
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
    return (
      <Container fluid>
        <Error message={serverError} />
        <Auth onAuth={onAuth} fetch_={fetch_} />
      </Container>
    )
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
