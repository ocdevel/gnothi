import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import './App.css'
import {
  Nav,
  Navbar,
  NavDropdown,
  Badge,
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap'
import {
  useHistory
} from "react-router-dom";
import emoji from 'react-easy-emoji'
import {aiStatusEmoji, SimplePopover} from "./utils"
import {
  FaSearch,
  FaRegListAlt,
  FaTextHeight,
  FaQuestion,
  FaCubes,
  FaBook,
  FaLock
} from 'react-icons/fa'

import { useSelector, useDispatch } from 'react-redux'
import { logout, changeAs } from './redux/actions';

const tools = [
  {
    route: '/summarize',
    minEntries: 1,
    label: "Summarize",
    icon: <FaTextHeight />,
    popover: "Generate summaries of entries",
  },
  {
    route: '/themes',
    minEntries: 4,
    popover: "Common themes across entries",
    label: "Themes",
    icon: <FaCubes />,
  },
  {
    route: '/ask',
    minEntries: 2,
    label: "Ask",
    icon: <FaQuestion />,
    popover: "Ask a question about entries",
  },
  {
    route: '/resources',
    minEntries: 3,
    label: "Resources",
    icon: <FaBook />,
    popover: "Self-help book recommendations based on entries; find therapists",
  },
]

export default function MainNav() {
  const user = useSelector(state => state.user)
  const as = useSelector(state => state.as)
  const asUser = useSelector(state => state.asUser)
  const aiStatus = useSelector(state => state.aiStatus)
  const entries = useSelector(state => state.entries)
  const dispatch = useDispatch()

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

  const ne = entries.length

  return (
    <Navbar
      bg="dark"
      variant="dark"
      collapseOnSelect
      expand="lg"
    >
      <LinkContainer to="/">
        <Navbar.Brand>
          Gnothi {aiStatus_}
        </Navbar.Brand>
      </LinkContainer>
      <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <LinkContainer to='/j'>
            <Nav.Link><FaRegListAlt /> Entries</Nav.Link>
          </LinkContainer>
          {tools.map(t => ne >= t.minEntries && (
            <SimplePopover text={t.popover} overlayOpts={{placement: 'bottom'}}>
              <LinkContainer to={t.route}>
                <Nav.Link>{t.icon} {t.label}</Nav.Link>
              </LinkContainer>
            </SimplePopover>
          ))}
          {ne < 4 && (
            <SimplePopover text="More AI tools unlock with added entries" overlayOpts={{placement: 'bottom'}}>
              <Nav.Link>
                <FaLock /> More
              </Nav.Link>
            </SimplePopover>
          )}
          {/* Want resources as Resources->[Books|Therapists]? */}
          {/*<NavDropdown title="Resources" id="collasible-nav-dropdown">
            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
          </NavDropdown>*/}
        </Nav>
        <Nav>
          <NavDropdown title={email} id="basic-nav-dropdown">
            {renderAsSelect()}
            {canProfile && <LinkContainer to="/account/profile">
              <NavDropdown.Item>Profile</NavDropdown.Item>
            </LinkContainer>}
            {canProfile && <LinkContainer to="/account/people">
              <NavDropdown.Item>People</NavDropdown.Item>
            </LinkContainer>}
            {!as && <LinkContainer to="/account/sharing">
              <NavDropdown.Item>Sharing</NavDropdown.Item>
            </LinkContainer>}
            <NavDropdown.Item onClick={() => dispatch(logout())}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}
