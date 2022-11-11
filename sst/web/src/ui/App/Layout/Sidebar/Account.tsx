import {useStore} from "../../../../data/store";
import ProfileModal from "../../Account/Profile";
import Badge from "@mui/material/Badge";
import _ from "lodash";
import {RiSpyLine} from "react-icons/ri";
import {FaUser} from "react-icons/fa";
import React from "react";
import {NestedList, ListItem} from "./Utils";

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
    {canProfile && <ListItem onClick={toggle} primary="Profile" nested={true}/>}
  </>
}

interface UserSwitcher {
  userId: string
  nShares?: number
}
export function UserSwitcher({userId, nShares=0}: UserSwitcher) {
  const {me, as} = useStore(s => s.user)
  const users = useStore(s => s.res.users_list_response?.hash)
  const setAs = useStore(a => a.setAs)
  const notifs = useStore(s => s.res.notifs_notes_list_response?.hash)
  const thisUser = users?.[userId]

  function renderName() {
    const notif = notifs?.[userId]
    if (!notif) {
      return thisUser?.email
    }
    return <Badge color="primary" badgeContent={notif.count}>{thisUser?.email}</Badge>
  }
  const isMe = userId === me?.id
  const isCurrent = (as === userId) || (!as && isMe)
  const title = <>
    {isCurrent && nShares > 0 ? "* " : ""}
    {renderName()}
  </>

  return <ListItem
    onClick={() => isMe ? setAs(null) : setAs(userId)}
    secondary={title}
  />
}

export function Account() {
  const setAs = useStore(a => a.setAs)
  const logout = useStore(actions => actions.logout)

  const user = useStore(s => s.user)
  const shares = useStore(s => s.res['shares_ingress_list_response'])
  const notifs = useStore(s => s.res['notifs_shares_list_response']?.hash)
  const users = useStore(s => s.res.users_list_response?.hash)
  const setSharePage = useStore(a => a.setSharePage)

  if (!user?.me) {return null}
  const {as, viewer, me} = user

  function renderSwitcher(shareId: string) {
    const share = shares!.hash[shareId]
    return <UserSwitcher userId={share.obj_id} key={shareId} nShares={nShares}/>
  }

  // FIXME
  let email: string | React.ReactNode = me.email
  if (as) {
    email = viewer.display_name
  } else {
    const ne = notifs?.[shareId]
    email = !ne ? email : <Badge color='error' badgeContent={ne}><span>{email}</span></Badge>
  }

  const nShares = shares?.ids?.length || 0

  return <>
    <NestedList
      icon={as ? <RiSpyLine /> : <FaUser />}
      primary='Account'
    >
      <UserSwitcher userId={me.id} nShares={nShares} />

      {shares?.ids?.map(renderSwitcher)}

      <ProfileLink as={as} asUser={viewer}/>
      {!as && <ListItem
        onClick={() => setSharePage({list: true})}
        primary='Sharing'
        nested={true}
       />}

      <ListItem
        onClick={() => logout()}
        primary='Logout'
        nested={true}
      />
    </NestedList>
  </>
}
