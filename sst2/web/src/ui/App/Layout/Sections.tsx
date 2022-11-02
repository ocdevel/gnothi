import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import {
  NavLink as Link,
} from "react-router-dom";
import {
  FaUser,
} from 'react-icons/fa'

import {useStore} from "../../../data/store"
import {
  RiSpyLine
} from "react-icons/ri";
import TopBooks from "./TopBooks";
import Links from "./Links";
import ProfileModal from "../Account/Profile";

import { makeStyles } from '@mui/material/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Highlight from "@mui/icons-material/Highlight";
import MenuBook from "@mui/icons-material/MenuBook";
import PostAdd from "@mui/icons-material/PostAdd";
import GroupAdd from "@mui/icons-material/GroupAdd";
import Chat from "@mui/icons-material/Chat";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import Footer from "../../Footer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";


// const useStyles = makeStyles((theme) => ({
//   root: {
//     width: '100%',
//     maxWidth: 360,
//     backgroundColor: theme.palette.background.paper,
//   },
//   nested: {
//     paddingLeft: theme.spacing(4),
//   },
// }));

function ListItem_(props) {
  // const classes = useStyles()
  const classes = {nested: {}}
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
  const profile = useStore(s => s.profile)
  const setProfile = useStore(a => a.setProfile)
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
  const me = useStore(s => s.res['users_get_response']?.first)
  const changeAs = useStore(a => a.changeAs)
  const notifs = useStore(s => s.res['notifs_notes_list_response'])
  const as = useStore(s => s.as)

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
  const changeAs = useStore(a => a.changeAs)
  const logout = useStore(actions => actions.logout)

  const user = useStore(s => s.res['users_get_response']?.first)
  const shares = useStore(s => s.res['shares_ingress_list_response'])
  const as = useStore(s => s.as)
  const asUser = useStore(s => s.asUser)
  const setSharePage = useStore(a => a.setSharePage)

  function renderSwitcher(id: string) {
    const s = shares.hash[id]
    return <UserSwitcher user={s.user} key={s.id} nShares={nShares}/>
  }

  if (!user?.email) {return null}

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

      {shares?.ids?.map(renderSwitcher)}

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
  const notifs = useStore(s => s.res['notifs_groups_list_response'])

  let text = <Typography>{g.title}</Typography>
  if (notifs?.[g.id]) {
    text = <Badge badgeContent={notifs[g.id]} color="primary">
      {text}
    </Badge>
  }
  return <ListItem_ to={`/groups/${g.id}`} primary={text} nested={true} icon={<Chat />}/>
}

export function GroupsSection() {
  const groups = useStore(s => s.res.groups_mine_list_response)

  function renderGroup(id: string) {
    const g = groups.hash[id]
    return <GroupItem g={g} key={id}/>
  }

  return <NestedList primary='Community'>
    <ListItem_ to='/groups' nested={true} primary='Groups' icon={<GroupAdd />}/>
    {groups?.ids?.map(renderGroup)}
  </NestedList>
}

export function MiscSection() {
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
  return <Stack direction='column' justify='space-between' sx={{height: '100%'}}>
    <Box flex={1}>
      <JournalSection />
      <Divider />
      <GroupsSection />
      <Divider />
      <AccountSection />
      <Divider />
      <MiscSection />
    </Box>
    <Footer />
  </Stack>
}
