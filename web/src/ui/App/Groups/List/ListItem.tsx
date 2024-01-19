import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback} from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import {FaRegComments, FaUsers} from "react-icons/fa";
import {timeAgo} from "../../../../utils/utils.tsx";

interface ListItem {
  gid: string
}
export function ListItem({gid}: ListItem) {
  const [
    g,
  ] = useStore(s => [
    s.res.groups_list_response?.hash?.[gid],
  ], shallow)

  const [
    setView,
  ] = useStore(useCallback(s => [
    s.groups.setView
  ], []))

  const showGroup = useCallback(() => setView({view: "view", gid}), [])

  return <div key={gid}>
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
