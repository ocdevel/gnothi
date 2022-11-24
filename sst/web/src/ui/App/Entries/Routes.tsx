import React, {lazy, useEffect} from 'react'
import {useParams} from "react-router-dom";
import {S, Error, Loading} from '../../Components/Routing'
import {useStore} from "../../../data/store";
const Layout = lazy(() => import("./Layout"))
const List = lazy(() => import("./List"))
const New = lazy(() => import("./Upsert"))
import {EntriesRouter as ModalRouter} from "./Modal"

const defaults = {errorElement: <Error />}

const routes = [
  {path: "j", ...defaults, element: <S><Layout /></S>, children: [
    {index: true, ...defaults, element: <S><New /></S>},
      {path: ":entry_id/:mode", ...defaults, element: <ModalRouter />},
      {path: "list", ...defaults, element: <S><List /></S>},
  ]}
]

export default routes
