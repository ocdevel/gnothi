import _ from "lodash";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {FaRegComments, FaUser} from "react-icons/fa";
import React, {useCallback} from "react";
import * as S from "@gnothi/schemas"
import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";

export default function Item({sid}: { sid: string }) {
  const [
    myGroups,
    s
  ] = useStore(s => [
    s.res.groups_mine_list_response?.hash,
    s.res.shares_egress_list_response?.hash?.[sid]
  ], shallow)
  const [
    setView
  ] = useStore(useCallback(s => [
    () => s.sharing.setView({tab: "egress", egress: "view", sid})
  ], []))

  function renderList(icon: JSX.Element, arr: any[], map_=_.identity) {
    debugger
    arr = _.compact(arr)
    if (!arr?.length) {return null}
    return <div>{icon} {arr.map(map_).join(', ')}</div>
  }

  if (!s) {return null}

  return <Card
    sx={{mb: 2, cursor: 'pointer'}}
    onClick={setView}
  >
    <CardContent>
      {renderList(<FaUser />, s.users)}
      {renderList(<FaRegComments />, s.groups, (id) => myGroups?.[id].title)}
    </CardContent>
  </Card>
}
