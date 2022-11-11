import React, {lazy} from 'react'
import {Navigate} from "react-router-dom";
import entriesRoutes from "./Entries/Routes"
import groupRoutes from "./Groups/Routes"
const Insights = lazy(() => import("./Insights"))
const Resources = lazy(() => import("./Resources"))
const Account = lazy(() => import("./Account"))

import {S, Error} from '@gnothi/web/src/ui/Components/Routing'

const routes = [
  ...entriesRoutes,
  {path: "insights", element: <S>
    {/*MainTags*/}
    <Insights />
  </S>},
  {path: "resources", element: <S><Resources /></S>},
  {path: "account", element: <Account />},
  ...groupRoutes,
  {index: true,  element: <Navigate to="/j" replace />}
]

export default routes
