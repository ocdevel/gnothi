import React from 'react'
import {Layout} from "./Layout";
import {Analyze} from "./Analyze/Analyze.tsx";
import {Track} from "./Track/Track.tsx";
import {Outlet} from "react-router-dom";

const defaults = {
  // errorElement: <Error />
}

const routes = [
  {path: "behaviors", ...defaults, element: <Layout />, children: [
    {index: true, ...defaults, element: <Track />},
    {path: "analyze", element: <Analyze />}
  ]},
]

export default routes
