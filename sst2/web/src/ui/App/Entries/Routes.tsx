import React, {lazy} from 'react'
import {S, Error} from '../../Components/Routing'
const Layout = lazy(() => import("./Layout"))
const List = lazy(() => import("./List"))
const EntryPage = lazy(() => import("./View"))

const routes = [
  {path: "j", errorElement: <Error />, element: <S><Layout /></S>, children: [
    {index: true, errorElement: <Error />, element: <S><List /></S>},
    {path: "entry", errorElement: <Error />, element: <S><EntryPage /></S>},
    {path: "entry/:entry_id", errorElement: <Error />, element: <S><EntryPage /></S>},
  ]}
]

export default routes
