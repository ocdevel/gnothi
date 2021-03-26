import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import {
  Nav,
  Navbar,
  NavDropdown,
  Badge,
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap'
import {
  NavLink as Link,
  useHistory
} from "react-router-dom";
import emoji from 'react-easy-emoji'
import {aiStatusEmoji, SimplePopover} from "../utils"
import {
  FaRobot,
  FaRegListAlt,
  FaBook, FaRegComments, FaUser,
} from 'react-icons/fa'
import './style.scss'

import {useStoreState, useStoreActions} from "easy-peasy";
import {FaQuestion} from "react-icons/fa/index";
import {AiOutlineUserSwitch} from "react-icons/all";

function IconItem({icon, text}) {
  return <div className='d-flex align-items-center'>
    {icon}
    <span className='ml-2'>{text}</span>
  </div>
}

export function Sidebar() {
  const changeAs = useStoreActions(a => a.ws.changeAs)
  const logout = useStoreActions(actions => actions.user.logout)

  const user = useStoreState(s => s.ws.data['users/user/get'])
  const shares = useStoreState(s => s.ws.data['users/shares/get'])
  const as = useStoreState(s => s.ws.as)
  const asUser = useStoreState(s => s.ws.asUser)
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)

  const [showAccount, setShowAccount] = useState(true)
  const [showGroups, setShowGroups] = useState(true)
  const [showInsights, setShowInsights] = useState(true)

  function renderSwitcher (s, i, last) {
    if (s.id == as) {return null}
    const klass = i == last ? 'nav-sb-bb' : ''
    let children = s.new_entries ? <Badge pill variant='danger'>{s.new_entries}</Badge>
        : null
    children = <>{children} {s.email}</>
    return <li className={klass} key={s.id}>
      <a
        onClick={() => changeAs(s.id)}
        key={s.id}
      >
        <IconItem icon={<AiOutlineUserSwitch />} text={children} />
      </a>
    </li>
  }

  const renderAsSelect = () => {
    if (!shares.length) {
      return
    }
    const last = shares.length - 1
    return <>
      {as && (
        <li><a onClick={() => changeAs(null)}>
          <IconItem icon={<AiOutlineUserSwitch />} text={user.email} />
        </a></li>
      )}
      {shares.map((s, i) => renderSwitcher(s, i, last))}
    </>
  }

  let email = user.email
  if (asUser) {
    email = <>{emoji("🕵️")} {asUser.email}</>
  } else {
    const ne = _.reduce(shares, (m, v) => m + v.new_entries, 0)
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


  return <nav className='nav-sb'>
    <div className='nav-sb-header'>
      <div>Gnothi {aiStatus_}</div>
    </div>
    <ul className="list-unstyled components">

      <li className='nav-sb-bb'>
        <Link to='/j'><IconItem icon={<FaRegListAlt />} text="Journal" /></Link>
      </li>
      <li className="nav-sb-bb">
        <a
          onClick={() => setShowInsights(!showInsights)}
          data-toggle="collapse"
          className="dropdown-toggle"
        >
          <IconItem icon={<FaRobot />} text='AI' />
        </a>
        <ul className={`collapse list-unstyled ${showInsights && 'show'}`}>
          <li>
            <Link to='/insights'><IconItem icon={<FaQuestion />} text="Insights" /></Link>
          </li>
          <li>
            <Link to='/resources'><IconItem icon={<FaBook />} text="Books" /></Link>
          </li>
        </ul>
      </li>
      <li className='nav-sb-bb'>
        <Link to='/groups'>
          <IconItem icon={<FaRegComments />} text="Community" />
        </Link>
      </li>
      <li className="nav-sb-bb">
        <a
          onClick={() => setShowAccount(!showAccount)}
          data-toggle="collapse"
          className="dropdown-toggle"
        >
          <IconItem icon={<FaUser />} text={email} />
        </a>
        <ul className={`collapse list-unstyled ${showAccount && 'show'}`}>
          {renderAsSelect()}
          {canProfile && <li>
            <Link to="/account/profile">Profile</Link>
          </li>}
          {!as && <li>
            <Link to="/account/sharing">Sharing</Link>
          </li>}
          <li><a onClick={() => logout()}>Logout</a></li>
        </ul>
      </li>
    </ul>
  </nav>
}
