import _ from "lodash";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {FaRegComments, FaUser} from "react-icons/fa";
import React from "react";
import * as S from "@gnothi/schemas"
import {useStore} from "../../../../data/store";

type Item = {
  s: S.Shares.shares_egress_list_response
}
export default function Item({s}: Item) {
  let myGroups = useStore(s => s.res.groups_mine_list_response?.hash)
  const setView = useStore(s => s.shares.setView)

  function renderList(icon: JSX.Element, arr: any[], map_=_.identity) {
    arr = _.compact(arr)
    if (!arr?.length) {return null}
    return <div>{icon} {arr.map(map_).join(', ')}</div>
  }

  return <Card>Share List Item (TODO)</Card>

  return <Card
    sx={{mb: 2, cursor: 'pointer'}}
    onClick={() => setView({sid: s.share.id})}
  >
    <CardContent>
      {renderList(<FaUser />, s?.users)}
      {renderList(<FaRegComments />, s?.groups, id => myGroups[id].title)}
    </CardContent>
  </Card>
}
