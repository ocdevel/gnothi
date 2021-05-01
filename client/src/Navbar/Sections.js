import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import {
  NavLink as Link,
  useHistory, useParams
} from "react-router-dom";
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
import {Highlight, MenuBook, PostAdd, Group, GroupAdd, Chat} from "@material-ui/icons";
import {
  Divider, ListSubheader, List, ListItem,
  ListItemIcon, ListItemText, Collapse, Typography, Badge
} from "@material-ui/core";
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

function ListItem_(props) {
  const classes = useStyles()
  const {nested, open, icon, primary, secondary, ...rest} = props
  if (rest.to) {
    rest.component = Link
  }
  if (nested) {
    rest.className = classes.nested
  }
  return <ListItem button {...rest}>
    {icon && <ListItemIcon>{icon}</ListItemIcon>}
    <ListItemText primary={primary} secondary={secondary} />
    {open === true ? <ExpandLess /> : open === false ? <ExpandMore /> : null}
  </ListItem>
}

export function NestedList({primary, children, secondary=null, startOpen=true, icon=null}) {
  const [open, setOpen] = React.useState(startOpen);
  const toggle = () => {setOpen(!open)}

  return <List>
    <ListItem_ onClick={toggle} open={open} primary={primary} secondary={secondary} icon={icon} />
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </List>
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
    {canProfile && <ListItem_ onClick={toggle} primary="Profile" nested={true}/>}
  </>
}

export function UserSwitcher({user, nShares=0}) {
  const me = useStoreState(s => s.ws.data['users/user/get'])
  const changeAs = useStoreActions(a => a.user.changeAs)
  const notifs = useStoreState(s => s.ws.data['notifs/notes/get'])
  const as = useStoreState(s => s.user.as)

  const isMe = user.id === me.id
  const notif = notifs?.[user.id]
      ? <Badge variant='success' size='sm' className='ml-1'>{notifs[user.id]}</Badge>
      : null
  const isCurrent = (as === user.id) || (!as && isMe)
  const title = <>
    {isCurrent && nShares > 0 ? "* " : ""}
    {user.email}{notif}
  </>

  return <ListItem_
    onClick={() => isMe ? changeAs(null) : changeAs(user.id)}
    secondary={title}
  />
}

export function AccountSection() {
  const changeAs = useStoreActions(a => a.user.changeAs)
  const logout = useStoreActions(actions => actions.user.logout)

  const user = useStoreState(s => s.ws.data['users/user/get'])
  const shares = useStoreState(s => s.ws.data['shares/ingress/get'])
  const as = useStoreState(s => s.user.as)
  const asUser = useStoreState(s => s.user.asUser)
  const setSharePage = useStoreActions(a => a.user.setSharePage)

  // FIXME
  let email = user.email
  if (asUser) {
    email = asUser.user.display_name
  } else {
    const ne = _.reduce(shares, (m, v) => m + v.new_entries, 0)
    email = !ne ? email : <><Badge pill variant='danger'>{ne}</Badge> {email}</>
  }

  const nShares = shares?.length || 0

  return <>
    <NestedList
      icon={asUser ? <RiSpyLine /> : <FaUser />}
      primary='Account'
    >
      <UserSwitcher user={user} nShares={nShares} />

      {shares.map(s => <UserSwitcher user={s.user} key={s.user.id} nShares={nShares}/>)}

      <ProfileLink as={as} asUser={asUser}/>
      {!as && <ListItem_
        onClick={() => setSharePage({list: true})}
        primary='Sharing'
        nested={true}
       />}

      <ListItem_
        onClick={() => logout()}
        primary='Logout'
        nested={true}
      />
    </NestedList>
  </>
}

export function GroupItem({g}) {
  const notifs = useStoreState(s => s.ws.data['notifs/groups/get'])

  let text = <Typography>{g.title}</Typography>
  if (notifs?.[g.id]) {
    text = <Badge badgeContent={notifs[g.id]} color="primary">
      {text}
    </Badge>
  }
  return <ListItem_ to={`/groups/${g.id}`} primary={text} nested={true} icon={<Chat />}/>
}

export function GroupsSection() {
  const groups = useStoreState(s => s.ws.data['groups/mine/get'])
  const {arr, obj} = groups

  return <NestedList primary='Community'>
    <ListItem_ to='/groups' nested={true} primary='Groups' icon={<GroupAdd />}/>
    {arr?.length > 0 && arr.map(gid => <GroupItem g={obj[gid]} key={gid}/>)}
  </NestedList>
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

    <NestedList primary='Misc' startOpen={false}>
      <ListItem_ onClick={toggleBooks} primary='Top Books' nested={true} />
      <ListItem_ onClick={toggleLinks} primary='Links' nested={true} />
    </NestedList>
  </>
}

export function JournalSection() {
  return <NestedList primary='Journal'>
    <ListItem_ to='/j' icon={<PostAdd />} primary='Entries' nested={true} />
    <ListItem_ to='/insights' icon={<Highlight />} primary='Insights' nested={true} />
    <ListItem_ to='/resources' icon={<MenuBook />} primary='Books' nested={true} />
  </NestedList>
}

export default function Sections() {
  return <>
    <AccountSection />
    <Divider />
    <JournalSection />
    <Divider />
    <GroupsSection />
    <Divider />
    <MiscSection />
  </>
}
