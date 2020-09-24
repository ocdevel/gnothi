import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import './App.css'
import {
  Nav,
  Navbar,
  NavDropdown,
  Badge
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap'
import {
  useHistory
} from "react-router-dom";
import emoji from 'react-easy-emoji'
import {aiStatusEmoji, SimplePopover} from "./utils"

import { useSelector, useDispatch } from 'react-redux'
import { logout, changeAs } from './redux/actions';


export default function MainNav() {
  const user = useSelector(state => state.user);
  const as = useSelector(state => state.as);
  const asUser = useSelector(state => state.asUser);
  const aiStatus = useSelector(state => state.aiStatus);
  const dispatch = useDispatch();

  const renderAsSelect = () => {
    if (!user.shared_with_me.length) {
      return
    }
    return <>
      {as && (
        <NavDropdown.Item onClick={() => dispatch(changeAs(null))}>
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
      <NavDropdown.Divider/>
    </>
  }

  let email = user.email
  if (asUser) {
    email = <>{emoji("🕵️")} {asUser.email}</>
  } else {
    const ne = _.reduce(user.shared_with_me, (m, v) => m + v.new_entries, 0)
    email = !ne ? email : <><Badge pill variant='danger'>{ne}</Badge> {email}</>
  }

  const canProfile = !as || (asUser && asUser.profile)

  let aiStatus_ = null
  if (~['off', 'pending'].indexOf(aiStatus)) {
    aiStatus_ = {
      off: "AI server is offline",
      pending: "AI server is coming online"
    }[aiStatus]
    aiStatus_ = <SimplePopover text={aiStatus_} overlayOpts={{placement: 'right'}}>
      <span>{aiStatusEmoji(aiStatus)}</span>
    </SimplePopover>
  }

  return (
    <Navbar bg="dark" variant="dark">
      <LinkContainer to="/">
        <Navbar.Brand>
          Gnothi {aiStatus_}
        </Navbar.Brand>
      </LinkContainer>
      <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
        </Nav>
        <Nav>
          <NavDropdown title={email} id="basic-nav-dropdown">
            {renderAsSelect()}
            {canProfile && <LinkContainer to="/profile/profile">
              <NavDropdown.Item>Profile</NavDropdown.Item>
            </LinkContainer>}
            {canProfile && <LinkContainer to="/profile/people">
              <NavDropdown.Item>People</NavDropdown.Item>
            </LinkContainer>}
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
