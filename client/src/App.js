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
import Themes from './Themes'
import Books from './Books'
import Error from './Error'
import moment from "moment-timezone";

let host = window.location.origin.split(':')
// host = host[0] + ':' + host[1] + ':' + 3001
host = host[0] + ':' + host[1] + ':' + (host[2] === "3002" ? "5002" : "5001")

function App() {
  const [jwt, setJwt] = useState(localStorage.getItem('jwt'))
  const [user, setUser] = useState()
  const [as, setAs] = useState()
  const [serverError, setServerError] = useState()
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

  useEffect(() => { getUser() }, [jwt])

  const logout = () => {
    localStorage.removeItem('jwt')
    window.location.href = "/"
  }

  const renderAsSelect = () => {
    if (_.isEmpty(user.shared_with_me)) {return}
    return <>
      {as && (
        <NavDropdown.Item onClick={() => setAs()}>
          🔀{user.username}
        </NavDropdown.Item>
      )}
      {user.shared_with_me.map(s => s.id != as && (
        <NavDropdown.Item onClick={() => setAs(s.id)}>
          🔀{s.username}
        </NavDropdown.Item>
      ))}
      <NavDropdown.Divider />
    </>
  }

  const renderNav = () => {
    let username = !as ? user.username :
      "🕵️" + _.find(user.shared_with_me, {id: as}).username
    return (
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="/">Gnothi</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
            <LinkContainer exact to="/j">
              <Nav.Link>Journal</Nav.Link>
            </LinkContainer>
            <LinkContainer exact to="/themes">
              <Nav.Link>Themes</Nav.Link>
            </LinkContainer>
            <LinkContainer exact to="/books">
              <Nav.Link>Books</Nav.Link>
            </LinkContainer>
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
      <br/>
      <Container fluid key={as}>
        <Error message={serverError} />
        <Switch>
          <Route path="/j">
            <Journal fetch_={fetch_} as={as} setServerError={setServerError}/>
          </Route>
          <Route path="/themes">
            <Themes fetch_={fetch_} as={as} />
          </Route>
          <Route path="/books">
            <Books fetch_={fetch_} as={as} />
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
