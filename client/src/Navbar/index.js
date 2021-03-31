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
import {AiOutlineUserSwitch, GiSpy, RiSpyLine} from "react-icons/all";

function IconItem({icon, text}) {
  return <div className='d-flex align-items-center'>
    {icon}
    <span className='ml-2'>{text}</span>
  </div>
}

function ToggleSection({icon, text, children}) {
  const [show, setShow] = useState(true)
  function toggle() {
    setShow(!show)
  }

  return <li className="nav-sb-bb">
    <a
      onClick={toggle}
      data-toggle="collapse"
      className="dropdown-toggle"
    >
      <IconItem icon={icon} text={text} />
    </a>
    <ul className={`collapse list-unstyled ${show && 'show'}`}>
      {children}
    </ul>
  </li>
}



function AccountSection() {
  const changeAs = useStoreActions(a => a.user.changeAs)
  const logout = useStoreActions(actions => actions.user.logout)

  const user = useStoreState(s => s.ws.data['users/user/get'])
  const shares = useStoreState(s => s.ws.data['shares/ingress/get'])
  const as = useStoreState(s => s.user.as)
  const asUser = useStoreState(s => s.user.asUser)

  function renderSwitcher (s, i, last) {
    const {share, user} = s
    if (user.id == as) {return null}
    const klass = i === last ? 'nav-sb-bb' : ''
    let children = share.new_entries ? <Badge pill variant='danger'>{share.new_entries}</Badge>
        : null
    children = <>{children} {user.email}</>
    return <li className={klass} key={user.id}>
      <a
        onClick={() => changeAs(user.id)}
        key={user.id}
      >
        <IconItem icon={<AiOutlineUserSwitch />} text={children} />
      </a>
    </li>
  }

  const renderAsSelect = () => {
    if (!shares?.length) {return null}
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
    email = asUser.user.display_name
  } else {
    const ne = _.reduce(shares, (m, v) => m + v.new_entries, 0)
    email = !ne ? email : <><Badge pill variant='danger'>{ne}</Badge> {email}</>
  }

  const canProfile = !as || (asUser?.share?.profile)

  return <ToggleSection icon={asUser ? <RiSpyLine /> : <FaUser />} text={email}>
    {renderAsSelect()}
    {canProfile && <li>
      <Link to="/account/profile">Profile</Link>
    </li>}
    {!as && <li>
      <Link to="/account/sharing">Sharing</Link>
    </li>}
    <li><a onClick={() => logout()}>Logout</a></li>
  </ToggleSection>
}

function GroupsSection() {
  const groups = useStoreState(s => s.ws.data['groups/mine/get'])

  function renderGroup(g) {
    return <li><Link to={`/groups/${g.id}`}>{g.title}</Link></li>
  }

  return <ToggleSection icon={<FaRegComments />} text="Community">
    <li><Link to='/groups'>All Groups</Link></li>
    {groups?.length ? groups.map(renderGroup) : null}
  </ToggleSection>
}

export function Sidebar() {
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)

  const [showInsights, setShowInsights] = useState(true)

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
      <ToggleSection icon={<FaRobot />} text='AI'>
        <li>
          <Link to='/insights'><IconItem icon={<FaQuestion />} text="Insights" /></Link>
        </li>
        <li>
          <Link to='/resources'><IconItem icon={<FaBook />} text="Books" /></Link>
        </li>
      </ToggleSection>
      <GroupsSection />
      <AccountSection />
    </ul>
  </nav>
}
