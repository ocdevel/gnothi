import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import './App.css'
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Badge
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
import emoji from 'react-easy-emoji'
import {aiStatusEmoji} from "./utils"

import { Provider, useSelector, useDispatch } from 'react-redux'
import store from './redux/store';
import { getUser, logout, changeAs, checkAiStatus, getTags } from './redux/actions';


function App() {
  const jwt = useSelector(state => state.jwt);
  const user = useSelector(state => state.user);
  const as = useSelector(state => state.as);
  const asUser = useSelector(state => state.asUser);
  const aiStatus = useSelector(state => state.aiStatus);
  const serverError = useSelector(state => state.serverError);
	const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUser())

    // TODO move to websockets
    const timer = setInterval(() => dispatch(checkAiStatus()), 1000)
    return () => clearInterval(timer)
  }, [jwt, as])

  const renderAsSelect = () => {
    if (_.isEmpty(user.shared_with_me)) {return}
    return <>
      {as && (
        <NavDropdown.Item onClick={() => dispatch(changeAs())}>
          {emoji("🔀")}{user.email}
        </NavDropdown.Item>
      )}
      {user.shared_with_me.map(s => s.id != as && (
        <NavDropdown.Item onClick={() => dispatch(changeAs(s.id))}>
          {emoji("🔀")}
          {s.new_entries ? <Badge pill variant='danger'>{s.new_entries}</Badge> : null}
          {s.email}
        </NavDropdown.Item>
      ))}
      <NavDropdown.Divider />
    </>
  }

  const renderNav = () => {
    let email = user.email
    if (as) {
      // email = <>{emoji("🕵️")} {asUser.email}</>
      email = _.find(user.shared_with_me, {id: as}).email
    } else {
      const ne = _.reduce(user.shared_with_me, (m,v) => m + v.new_entries, 0)
      email = !ne ? email : <><Badge pill variant='danger'>{ne}</Badge> {email}</>
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
              <NavDropdown.Item onClick={() => dispatch(logout())}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }

  if (!user) {
    return <Splash />
  }

  // key={as} triggers refresh on these components (triggering fetches)
  return <>
    {renderNav()}
    <Container fluid key={as}>
      <Error message={serverError} />
      <Switch>
        <Route path="/j">
          <Journal />
        </Route>
        <Route path="/profile">
          <ProfileRoutes />
        </Route>
        <Redirect from="/" to="/j" />
      </Switch>
    </Container>
  </>
}

export default () => <>
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
</>;
