import React, { useState, useEffect } from 'react'
import './App.css'
import {
  Button,
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
import {fetch_} from "./utils";

function App() {
  const [jwt, setJwt] = useState()

  const onAuth = jwt => setJwt(jwt)

  const logout = () => {
    localStorage.removeItem('jwt')
    window.location.href = "/"
  }

  const checkJwt = async () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) { return }
    const res = await fetch_('check-jwt', 'GET', null, jwt)
    if (res.status_code == 401) { return logout() }
    onAuth(jwt);
  }

  useEffect(() => { checkJwt() }, [])

  const renderNav = () => (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand href="/">Gnothi</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <LinkContainer exact to="/j">
            <Nav.Link>Journal</Nav.Link>
          </LinkContainer>
          <NavDropdown title="Profile" id="basic-nav-dropdown">
            <LinkContainer to="/profile/sharing">
              <NavDropdown.Item>Sharing</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/profile/family">
              <NavDropdown.Item>Family</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/profile/resources">
              <NavDropdown.Item>Resources</NavDropdown.Item>
            </LinkContainer>
          </NavDropdown>
        </Nav>
        <Nav>
          <Nav.Link onClick={logout}>Logout</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )

  if (!jwt) {
    return (
      <Container fluid>
        <Auth onAuth={onAuth} />
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
            <Journal jwt={jwt} />
          </Route>
          <Route path="/profile">
            <Profile jwt={jwt} />
          </Route>
          <Redirect from="/" to="/j" />
        </Switch>
      </Container>
    </Router>
  )
}

export default App;
