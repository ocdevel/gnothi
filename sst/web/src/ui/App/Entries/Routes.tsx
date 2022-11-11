import React, {lazy, useEffect} from 'react'
import {useParams} from "react-router-dom";
import {S, Error, Loading} from '../../Components/Routing'
import {useStore} from "../../../data/store";
const Layout = lazy(() => import("./Layout"))
const List = lazy(() => import("./List"))
const New = lazy(() => import("./Upsert"))

function ModalRouter() {
  const {entry_id, mode} = useParams()
  const setEntryModal = useStore(s => s.setEntryModal)
  const entries = useStore(s => s.res.entries_list_response?.hash)

  const entry = entries?.[entry_id]

  if (!entry) {
    return <Loading label="entries_list_response" />
  }

  useEffect(() => {
    if (!entry) {return}
    setEntryModal({entry, mode})
  }, [entry_id, mode])

  // rendering handled in Modal.tsx
  return null
}

const defaults = {errorElement: <Error />}

const routes = [
  {path: "j", ...defaults, element: <S><Layout /></S>, children: [
    {index: true, ...defaults, element: <S><New /></S>},
    {path: "list", ...defaults, element: <S><List /></S>},
    {path: ":entry_id/:mode", ...defaults, element: <ModalRouter />},
  ]}
]

export default routes
