import React, { useState, useEffect } from 'react'
import _ from 'lodash'
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

function ListItem_({
  text,
  icon=null,
  to=null,
  onClick=null,
  nested=false,
  open=null
}) {
  const classes = useStyles()
  const opts = {}
  if (to) {
    opts.component = Link
    opts.to = to
  }
  if (onClick) {
    opts.onClick = onClick
  }
  if (nested) {
    opts.className = classes.nested
  }
  return <ListItem button {...opts}>
    {icon && <ListItemIcon>{icon}</ListItemIcon>}
    <ListItemText primary={text} />
    {open === true ? <ExpandLess /> : open === false ? <ExpandMore /> : null}
  </ListItem>
}

export function NestedList({text, children, startOpen=true, icon=null}) {
  const [open, setOpen] = React.useState(startOpen);
  const toggle = () => {setOpen(!open)}

  return <List>
    <ListItem_ onClick={toggle} open={open} text={text} icon={icon} />
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </List>
}

export function UserSwitcher({s}) {
  const changeAs = useStoreActions(a => a.user.changeAs)
  const notifs = useStoreState(s => s.ws.data['notifs/notes/get'])
  const as = useStoreState(s => s.user.as)

  const {share, user} = s
  if (user.id === as) {return null}
  const notif = notifs?.[user.id]
      ? <Badge variant='success' size='sm' className='ml-1'>{notifs[user.id]}</Badge>
      : null
  return <ListItem_
    onClick={() => changeAs(user.id)}
    key={user.id}
    icon={<AiOutlineUserSwitch />}
    text={<>{user.email}{notif}</>}
    nested={true}
  />
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
    {canProfile && <ListItem_ onClick={toggle} text="Profile" nested={true}/>}
  </>
}

export function JournalSection() {
  return <NestedList text='Journal'>
    <ListItem_ to='/j' icon={<PostAdd />} text='Entries' nested={true} />
    <ListItem_ to='/insights' icon={<Highlight />} text='Insights' nested={true} />
    <ListItem_ to='/resources' icon={<MenuBook />} text='Books' nested={true} />
  </NestedList>
}


export function AccountSection() {
  const changeAs = useStoreActions(a => a.user.changeAs)
  const logout = useStoreActions(actions => actions.user.logout)

  const user = useStoreState(s => s.ws.data['users/user/get'])
  const shares = useStoreState(s => s.ws.data['shares/ingress/get'])
  const as = useStoreState(s => s.user.as)
  const asUser = useStoreState(s => s.user.asUser)
  const setSharePage = useStoreActions(a => a.user.setSharePage)

  function renderAsSelect() {
    if (!shares?.length) {return null}
    const last = shares.length - 1
    return <>
      {as && <ListItem_
        icon={<AiOutlineUserSwitch />}
        onClick={() => changeAs(null)}
        text="Switch Back"
      />}
      {shares.map((s, i) => <React.Fragment key={s.user.id}>
        <UserSwitcher s={s}/>
        {i === last && <Divider />}
      </React.Fragment>)}
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
    <NestedList icon={asUser ? <RiSpyLine /> : <FaUser />} text={email}>
      {renderAsSelect()}
      <ProfileLink as={as} asUser={asUser}/>
      {!as && <ListItem_
        onClick={() => setSharePage({list: true})}
        text='Sharing'
        nested={true}
       />}
      <ListItem_
        onClick={() => logout()}
        text='Logout'
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
  return <ListItem_ to={`/groups/${g.id}`} text={text} nested={true} icon={<Chat />}/>
}

export function GroupsSection() {
  const groups = useStoreState(s => s.ws.data['groups/mine/get'])
  const {arr, obj} = groups

  return <NestedList text='Community'>
    <ListItem_ to='/groups' nested={true} text='Groups' icon={<GroupAdd />}/>
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

    <NestedList text='Misc' startOpen={false}>
      <ListItem_ onClick={toggleBooks} text='Top Books' nested={true} />
      <ListItem_ onClick={toggleLinks} text='Links' nested={true} />
    </NestedList>
  </>
}

export default function Sections() {
  return <>
    <AccountSection />
    <JournalSection />
    <GroupsSection />
    <MiscSection />
  </>
}
