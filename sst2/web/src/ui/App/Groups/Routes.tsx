import React, {lazy} from 'react'
import {S, Error} from '../../Components/Routing'
import {Route, Routes} from "react-router-dom";
const Layout = lazy(() => import("./Layout"))
const List = lazy(() => import("./List"))
const View = lazy(() => import("./View"))

const routes = [
  {path: "groups", errorElement: <Error />, element: <S><Layout /></S>, children: [
    {index: true, errorElement: <Error />, element: <S><List /></S>},
    {path: ":gid/*", errorElement: <Error />, element: <S><View /></S>}
  ]}
]

export default routes
