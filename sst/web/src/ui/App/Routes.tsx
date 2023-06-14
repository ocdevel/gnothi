import React, {lazy} from 'react'
import {Navigate} from "react-router-dom";
import entriesRoutes from "./Entries/Routes"
// import groupRoutes from "./Groups/Routes"
// const Account = lazy(() => import("./Account"))

import {S, Error} from '@gnothi/web/src/ui/Components/Routing'

const routes = [
  ...entriesRoutes,
  // {path: "account", element: <Account />},
  // ...groupRoutes,
  {index: true,  element: <Navigate to="/j" replace />}
]

export default routes
