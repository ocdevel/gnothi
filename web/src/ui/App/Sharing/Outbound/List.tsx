import React from "react";
import Item from './Item'
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../data/store";

export default function List() {
  const [
    ids,
  ] = useStore(s => [
    s.res.shares_egress_list_response?.ids,
  ], shallow)

  if (!ids?.length) { return null }

  return <div>
    {ids.map(sid => <Item key={sid} sid={sid}/>)}
  </div>
}
