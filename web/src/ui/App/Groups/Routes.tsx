import React, {lazy} from 'react'
import {S, Error} from '../../Components/Routing'
import {Route, Routes} from "react-router-dom";
import Layout from "./Layout"
import List from "./List"
import View from "./View"

const routes = [
  {path: "groups", errorElement: <Error />, element: <Layout />, children: [
    {index: true, errorElement: <Error />, element: <List />},
    {path: ":gid/*", errorElement: <Error />, element: <View />}
  ]}
]

export default routes
