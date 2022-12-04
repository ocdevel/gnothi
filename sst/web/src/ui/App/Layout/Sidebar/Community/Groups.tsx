import {useStore} from "../../../../../data/store";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import Chat from "@mui/icons-material/Chat";
import GroupAdd from "@mui/icons-material/GroupAdd";
import Share from "@mui/icons-material/Share"
import React from "react";
import {NestedList, ListItem} from '../Utils'


export function GroupItem({id, title}: {id: string, title: string}) {
  const notifs = useStore(s => s.res.notifs_groups_list_response?.hash)

  let text = <Typography>{title}</Typography>
  if (notifs?.[id]) {
    text = <Badge badgeContent={notifs[id].count} color="primary">
      {text}
    </Badge>
  }
  return <ListItem to={`/groups/${id}`} primary={text} nested={true} icon={<Chat />}/>
}

export function Groups() {
  const groups = useStore(s => s.res.groups_mine_list_response)
  const as = useStore(s => s.user.as)

  function renderGroup(id: string) {
    const g = groups.hash[id]
    return <GroupItem {...g} key={id}/>
  }

  return <>
    <ListItem to='/groups' nested={true} primary='Groups'/>
    {groups?.ids?.map(renderGroup)}
  </>
}
