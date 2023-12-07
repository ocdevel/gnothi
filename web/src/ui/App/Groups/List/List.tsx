import Edit from "../View/Edit";
import React, {useCallback, useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useStore} from "../../../../data/store"
import {ViewModal} from './ViewModal.tsx'
import {ListItem} from './ListItem.tsx'
// import Pay from './Pay'
import {shallow} from "zustand/shallow";

export default function List() {
  const [
    ids,
  ] = useStore(s => [
    s.res.groups_list_response?.ids,
  ], shallow)
  const [
    setView,
  ] = useStore(useCallback(s => [
    s.groups.setView
  ], []))

  return <div>
    {/*<Pay />*/}
    {ids?.map((id: string) => <ListItem key={id} gid={id} />)}
  </div>
}

