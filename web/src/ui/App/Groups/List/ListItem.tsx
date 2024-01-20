import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback} from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import {FaRegComments, FaUsers} from "react-icons/fa";
import {timeAgo} from "../../../../utils/utils.tsx";
import {Group} from "../../../../../../schemas/groups.ts";


interface ListItem {
  gid: string
}
export function ListItem({gid}: ListItem) {
  const g= useStore(s => s.res.groups_list_response?.hash?.[gid])
  if (!g) {return null}
  return <ListItem_ key={gid} g={g} />
}

function ListItem_({g}: {g: Group}) {
  const [
    showGroup,
  ] = useStore(useCallback(s => [
    () => s.groups.setView({view: "view", id: g.id})
  ], []))

  return <div>
    <Card className='mb-2 cursor-pointer' onClick={showGroup}>
      <CardContent>
        <CardHeader title={g.title} />
        <div><FaUsers /> {g.n_members} members</div>
        <div>
          <span><FaRegComments /> {g.n_messages} messages</span>
          <small className='muted ml-2'>({timeAgo(g.last_message)})</small>
        </div>
        <hr />
        <div className='text-muted'>{g.text_short}</div>
      </CardContent>
    </Card>
  </div>
}