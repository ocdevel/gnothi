import React, { useState, useEffect } from 'react'
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
import Profile from './Profile'

let host = window.location.origin.split(':')
// host = host[0] + ':' + host[1] + ':' + 3001
host = host[0] + ':' + host[1] + ':' + (host[2] === "3002" ? "5002" : "5001")

function App() {
  const [jwt, setJwt] = useState(localStorage.getItem('jwt'))
  const [user, setUser] = useState()

  const fetch_ = async (route, method='GET', body=null) => {
    const obj = {
      method,
      headers: {'Content-Type': 'application/json'},
    };
    if (body) obj['body'] = JSON.stringify(body)
    if (jwt) obj['headers']['Authorization'] = `JWT ${jwt}`
    // auth is added by flask-jwt as /auth, all my custom paths are under /api/*
    const url = route === 'auth' ? `${host}/${route}` :
      `${host}/api/${route}`
    const response = await fetch(url, obj)
    return await response.json()
  }

  const getUser = async () => {
    if (!jwt) {return}
    const res = await fetch_('user', 'GET')
    if (res.status_code == 401) { return logout() }
    setUser(res)
  }

  const onAuth = jwt_ => setJwt(jwt_)

  useEffect(() => { getUser() }, [jwt])

  const logout = () => {
    localStorage.removeItem('jwt')
    window.location.href = "/"
  }

  const renderNav = () => (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand href="/">Gnothi</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <LinkContainer exact to="/j">
            <Nav.Link>Journal</Nav.Link>
          </LinkContainer>
        </Nav>
        <Nav>
          <NavDropdown title={user.username} id="basic-nav-dropdown">
            <LinkContainer to="/profile/sharing">
              <NavDropdown.Item>Sharing</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/profile/family">
              <NavDropdown.Item>Family</NavDropdown.Item>
            </LinkContainer>
            <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )

  if (!user) {
    return (
      <Container fluid>
        <Auth onAuth={onAuth} fetch_={fetch_} />
      </Container>
    )
  }
  return (
    <Router>
      {renderNav()}
      <br/>
      <Container fluid>
        <Switch>
          <Route path="/j">
            <Journal fetch_={fetch_} />
          </Route>
          <Route path="/profile">
            <Profile fetch_={fetch_} />
          </Route>
          <Redirect from="/" to="/j" />
        </Switch>
      </Container>
    </Router>
  )
}

export default App;
