import {useStore} from "../../../../../data/store";
import React from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import {NestedList, ListItem} from "../Utils";

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
    sx={{ml: 4}}
    onClick={() => isMe ? setAs(null) : setAs(userId)}
    secondary={title}
  />
}

export default function Sharing() {
  const setSharePage = useStore(a => a.setSharePage)


  const user = useStore(s => s.user)
  const shares = useStore(s => s.res['shares_ingress_list_response'])
  const notifs = useStore(s => s.res['notifs_shares_list_response']?.hash)
  const users = useStore(s => s.res.users_list_response?.hash)


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
        onClick={() => setSharePage({list: true})}
        primary='Sharing'
        nested={true}
       />
    {renderSwitchers()}
  </>
}
