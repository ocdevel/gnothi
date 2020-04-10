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
import Family from './Family'
import Reports from './Reports'
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
            <Nav.Link>Entries</Nav.Link>
          </LinkContainer>
          <LinkContainer to="/j/fields">
            <Nav.Link>Fields</Nav.Link>
          </LinkContainer>
          <NavDropdown title="Reports" id="basic-nav-dropdown">
            <LinkContainer to="/reports/themes">
              <NavDropdown.Item>Themes</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/reports/summaries">
              <NavDropdown.Item>Summaries</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/reports/causation">
              <NavDropdown.Item>Causation</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/reports/association">
              <NavDropdown.Item>Free-word Association</NavDropdown.Item>
            </LinkContainer>
            <LinkContainer to="/reports/resources">
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
          <Route path="/family">
            <Family jwt={jwt} />
          </Route>
          <Route path="/reports">
            <Reports jwt={jwt} />
          </Route>
          <Redirect from="/" to="/j" />
        </Switch>
      </Container>
    </Router>
  )
}

export default App;
