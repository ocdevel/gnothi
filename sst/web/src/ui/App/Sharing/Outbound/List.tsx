import React from "react";
import Item from './Item'
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../data/store";

export default function List() {
    const [
    send,
    shares,
    view,
    setView
  ] = useStore(s => [
    s.send,
    s.res.shares_egress_list_response,
    s.sharing.view,
    s.sharing.setView
  ], shallow)

  if (!shares?.ids) {return null}
  const {ids, hash} = shares

  return <div>
    {ids?.map(sid => <Item key={sid} s={hash[sid]}/>)}
  </div>
}
