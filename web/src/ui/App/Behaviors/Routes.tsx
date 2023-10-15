import React from 'react'
import {BehaviorsContent} from "./Analyze.tsx";
import {Layout} from "./Layout";
import {Analyze} from "./Analyze";
import {Track} from "./Track";
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
