import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import {
  Badge, Button, Form,
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap'
import {
  NavLink as Link,
  useHistory, useParams
} from "react-router-dom";
import {aiStatusEmoji, SimplePopover} from "../utils"
import {
  FaRobot,
  FaRegListAlt,
  FaBook, FaRegComments, FaUser,
} from 'react-icons/fa'
import './style.scss'
import { useMediaQuery } from 'react-responsive'

import {useStoreState, useStoreActions} from "easy-peasy";
import {FaQuestion} from "react-icons/fa/index";
import {
  AiOutlineUserSwitch,
  IoEllipsisHorizontalSharp,
  MdClose,
  RiSpyLine
} from "react-icons/all";
import TopBooks from "./TopBooks";
import Links from "./Links";
import ProfileModal from "../Account/Profile";

import { makeStyles } from '@material-ui/core/styles';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import DraftsIcon from '@material-ui/icons/Drafts';
import SendIcon from '@material-ui/icons/Send';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import {Divider, ListSubheader, List, ListItem,
  ListItemIcon, ListItemText, Collapse} from "@material-ui/core";
import Drawer from "@material-ui/core/Drawer";


const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
}));

export function NestedList() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <List

    >
      <ListItem button>
        <ListItemIcon>
          <SendIcon />
        </ListItemIcon>
        <ListItemText primary="Sent mail" />
      </ListItem>
      <ListItem button>
        <ListItemIcon>
          <DraftsIcon />
        </ListItemIcon>
        <ListItemText primary="Drafts" />
      </ListItem>
      <ListItem button onClick={handleClick}>
        <ListItemIcon>
          <InboxIcon />
        </ListItemIcon>
        <ListItemText primary="Inbox" />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button className={classes.nested}>
            <ListItemIcon>
              <StarBorder />
            </ListItemIcon>
            <ListItemText primary="Starred" />
          </ListItem>
        </List>
      </Collapse>
    </List>
  );
}



export function IconItem({icon, text}) {
  return <div className='d-flex align-items-center'>
    {icon}
    <span className='ml-2'>{text}</span>
  </div>
}

export function ToggleSection({icon, text, children, open=true}) {
  const [show, setShow] = useState(open)
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


export function UserSwitcher({s, isLast}) {
  const changeAs = useStoreActions(a => a.user.changeAs)
  const notifs = useStoreState(s => s.ws.data['notifs/notes/get'])
  const as = useStoreState(s => s.user.as)

  const {share, user} = s
  if (user.id === as) {return null}
  const klass = isLast ? 'nav-sb-bb' : ''
  const notif = notifs?.[user.id]
      ? <Badge variant='success' size='sm' className='ml-1'>{notifs[user.id]}</Badge>
      : null
  return <li className={klass} key={user.id}>
    <a
      onClick={() => changeAs(user.id)}
      key={user.id}
    >
      <IconItem icon={<AiOutlineUserSwitch />} text={<>{user.email}{notif}</>} />
    </a>
  </li>
}

export function ProfileLink({as, asUser}) {
  const profile = useStoreState(s => s.user.profile)
  const setProfile = useStoreActions(a => a.user.setProfile)
  function toggle() {
    if (profile) {
      setProfile(null)
    } else {
      setProfile(true) // TODO use profile object
    }
  }
  const canProfile = !as || (asUser?.share?.profile)
  return <>
    {profile && <ProfileModal close={toggle} />}
    {canProfile && <li>
      <a onClick={toggle}>Profile</a>
    </li>}
  </>
}

export function JournalSection() {
  return <ListItem button component={Link} to='/j'>
    <ListItemIcon><InboxIcon /></ListItemIcon>
    <ListItemText primary='Journal' />
    {/*<IconItem icon={<FaRegListAlt />} text="Journal" />*/}
  </ListItem>
}

export function InsightsSection() {
  return <ToggleSection icon={<FaRobot />} text='AI'>
    <li>
      <Link to='/insights'>
        {/*<IconItem icon={<FaQuestion />} text="Insights" />*/}
        Insights
      </Link>
    </li>
    <li>
      <Link to='/resources'>
        {/*<IconItem icon={<FaBook />} text="Book Recs" />*/}
        Book Recs
      </Link>
    </li>
  </ToggleSection>
}

export function AccountSection() {
  return null
  const changeAs = useStoreActions(a => a.user.changeAs)
  const logout = useStoreActions(actions => actions.user.logout)

  const user = useStoreState(s => s.ws.data['users/user/get'])
  const shares = useStoreState(s => s.ws.data['shares/ingress/get'])
  const as = useStoreState(s => s.user.as)
  const asUser = useStoreState(s => s.user.asUser)
  const setSharePage = useStoreActions(a => a.user.setSharePage)

  const renderAsSelect = () => {
    if (!shares?.length) {return null}
    const last = shares.length - 1
    return <>
      {as && (
        <li><a onClick={() => changeAs(null)}>
          <IconItem icon={<AiOutlineUserSwitch />} text={user.email} />
        </a></li>
      )}
      {shares.map((s, i) =><UserSwitcher key={s.user.id} s={s} isLast={i === last} />)}
    </>
  }

  let email = user.email
  if (asUser) {
    email = asUser.user.display_name
  } else {
    const ne = _.reduce(shares, (m, v) => m + v.new_entries, 0)
    email = !ne ? email : <><Badge pill variant='danger'>{ne}</Badge> {email}</>
  }

  return <>
    <ToggleSection icon={asUser ? <RiSpyLine /> : <FaUser />} text={email}>
      {renderAsSelect()}
      <ProfileLink as={as} asUser={asUser}/>
      {!as && <li>
        <a onClick={() => setSharePage({list: true})}>Sharing</a>
      </li>}
      <li><a onClick={() => logout()}>Logout</a></li>
    </ToggleSection>
  </>
}

export function GroupItem({g}) {
  const notifs = useStoreState(s => s.ws.data['notifs/groups/get'])

  const notif = notifs?.[g.id]
      ? <Badge variant='success' size='sm' className='ml-1'>{notifs[g.id]}</Badge>
      : null
  return <li><Link to={`/groups/${g.id}`}>{g.title}{notif}</Link></li>
}

export function GroupsSection() {
  const groups = useStoreState(s => s.ws.data['groups/mine/get'])
  const {arr, obj} = groups

  return <>
    <ToggleSection icon={<FaRegComments />} text="Community">
      <li>
        <Link exact to='/groups'>All Groups</Link>
      </li>
      {arr?.length > 0 && arr.map(gid => <GroupItem g={obj[gid]} key={gid}/>)}
    </ToggleSection>
  </>
}

export function MiscSection() {
  const classes = useStyles();
  const [showTopBooks, setShowTopBooks] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  function toggleBooks() {
    setShowTopBooks(!showTopBooks)
  }
  function toggleLinks() {
    setShowLinks(!showLinks)
  }

  return <>
    {showTopBooks && <TopBooks close={toggleBooks} />}
    {showLinks && <Links close={toggleLinks} />}

    <NestedList>
      <ListItem button onClick={toggleBooks}>
        <ListItemText primary='Top Books' />
      </ListItem>
      <ListItem button onClick={toggleLinks}>
        <ListItemText primary='Links' />
      </ListItem>
    </NestedList>
    <Divider />
  </>
}

export default function Sections() {
  return <>
    <List>
      <AccountSection />
      <JournalSection />
      <InsightsSection />
      <GroupsSection />
      <MiscSection />
    </List>
  </>
}
