import React from "react";
import Item from './Item'
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../data/store";
import {useShallow} from "zustand/react/shallow";

export default function List() {
  const [
    ids,
  ] = useStore(useShallow(s => [
    s.res.shares_egress_list_response?.ids,
  ]))

  return <div>
    {ids?.map(sid => <Item key={sid} sid={sid}/>)}
  </div>
}
