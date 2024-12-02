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
    setAs,
  ] = useStore(s => [
    s.user?.me,
    s.user?.as,
    s.res.users_list_response?.hash,
    s.res.notifs_notes_list_response?.hash,
    s.setAs,
  ], shallow)

  const thisUser = users?.[userId]
  const isMe = userId === me?.id
  const handleClick = useCallback(() => {
    setAs(isMe ? null : userId)
  }, [isMe, userId, setAs])

  function renderName() {
    const notif = notifs?.[userId]
    if (!notif) {
      return thisUser?.email || `Unknown User (${userId})`
    }
    return <Badge color="primary" badgeContent={notif.count}>{thisUser?.email || `Unknown User (${userId})`}</Badge>
  }
  const isCurrent = (as === userId) || (!as && isMe)
  const title = <>
    {isCurrent && nShares > 0 ? "* " : ""}
    {renderName()}
  </>

  return <ListItem
    sx={{ml: 4}}
    onClick={handleClick}
    secondary={title}
  />
}

export default function Sharing() {
  const [
    user,
    shares,
    shareNotifs,
    noteNotifs,
    users,
    send,
  ] = useStore(s => [
    s.user,
    s.res['shares_ingress_list_response']?.rows,
    s.res['notifs_shares_list_response']?.hash,
    s.res['notifs_notes_list_response']?.hash,
    s.res.users_list_response?.hash,
    s.send,
  ], shallow)

  const [openModal] = useStore(useCallback(s => [
    () => s.sharing.setView({tab: "egress", egress: "new"}),
  ], []))

  if (!user?.me) {return null}
  const {as, viewer, me} = user

  // Show notifications for both shares and notes
  let email: string | React.ReactNode = me.email
  if (as) {
    email = viewer?.display_name
  } else {
    // Count total notifications
    const totalNotifs = Object.values(shareNotifs || {}).reduce((sum, n) => sum + (n?.count || 0), 0) +
      Object.values(noteNotifs || {}).reduce((sum, n) => sum + (n?.count || 0), 0)
    
    email = totalNotifs === 0 ? email : 
      <Badge color='error' badgeContent={totalNotifs}>
        <span>{email}</span>
      </Badge>
  }

  const nShares = shares?.length || 0

  function renderSwitcher(share: any) {
    return <UserSwitcher userId={share.user.id} key={share.user.id} nShares={nShares}/>
  }

  function renderSwitchers() {
    // don't show anything if there are no shares
    if (nShares === 0) {return null}

    // Get unique list of users (me + sharers)
    const userIds = new Set([me.id])
    shares?.forEach(share => userIds.add(share.user.id))

    return <>
      {Array.from(userIds).map(userId => 
        <UserSwitcher userId={userId} key={userId} nShares={nShares} />
      )}
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
