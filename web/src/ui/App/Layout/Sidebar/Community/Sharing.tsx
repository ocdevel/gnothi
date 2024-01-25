import {useStore} from "../../../../../data/store";
import React, {useCallback} from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import {NestedList, ListItem} from "../Utils";
import {shallow} from "zustand/shallow";

interface UserSwitcher {
  userId: string
  nShares?: number
}
export function UserSwitcher({userId, nShares=0}: UserSwitcher) {
  const [
    me,
    as,
    users,
    notifs,
  ] = useStore(s => [
    s.user?.me,
    s.user?.as,
    s.res.users_list_response?.hash,
    s.res.notifs_notes_list_response?.hash,
  ], shallow)
  const thisUser = users?.[userId]
  const isMe = userId === me?.id
  const [
    setAs
  ] = useStore(useCallback(s => [
    () => isMe ? setAs(null) : s.setAs(userId),
  ], []))

  function renderName() {
    const notif = notifs?.[userId]
    if (!notif) {
      return thisUser?.email
    }
    return <Badge color="primary" badgeContent={notif.count}>{thisUser?.email}</Badge>
  }
  const isCurrent = (as === userId) || (!as && isMe)
  const title = <>
    {isCurrent && nShares > 0 ? "* " : ""}
    {renderName()}
  </>

  return <ListItem
    sx={{ml: 4}}
    onClick={setAs}
    secondary={title}
  />
}

export default function Sharing() {
  const [
    user,
    shares,
    notifs,
    users
  ] = useStore(s => [
    s.user,
    s.res['shares_ingress_list_response'],
    s.res['notifs_shares_list_response']?.hash,
    s.res.users_list_response?.hash,
  ], shallow)
  const [openModal] = useStore(useCallback(s => [
    () => s.sharing.setView({tab: "egress", egress: "new"})
  ], []))

  if (!user?.me) {return null}
  const {as, viewer, me} = user

  // FIXME
  let email: string | React.ReactNode = me.email
  if (as) {
    email = viewer.display_name
  } else {
    const ne = notifs?.[shareId]
    email = !ne ? email : <Badge color='error' badgeContent={ne}><span>{email}</span></Badge>
  }

  const nShares = shares?.ids?.length || 0

  function renderSwitcher(shareId: string) {
    const share = shares!.hash[shareId]
    return <UserSwitcher userId={share.obj_id} key={shareId} nShares={nShares}/>
  }

  function renderSwitchers() {
    // don't show "switch to self" if I'm the only one (no shares)
    if (nShares === 0)  {return null}
    return <>
      <UserSwitcher userId={me.id} nShares={nShares} />
      {shares?.ids?.map(renderSwitcher)}
    </>
  }

  return <>
      <ListItem
        onClick={openModal}
        primary='Sharing'
        nested={true}
       />
    {renderSwitchers()}
  </>
}
