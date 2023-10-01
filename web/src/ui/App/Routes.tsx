import React, {lazy} from 'react'
import {Navigate} from "react-router-dom";
import entriesRoutes from "./Entries/Routes"
// import groupRoutes from "./Groups/Routes"
// const Account = lazy(() => import("./Account"))

import {S, Error} from '@gnothi/web/src/ui/Components/Routing'
import {BehaviorsContent} from "./Behaviors/Modal";

const routes = [
  ...entriesRoutes,
  // {path: "account", element: <Account />},
  // ...groupRoutes,
  {path: "behaviors", element: <BehaviorsContent />},
  // {index: true,  element: <Navigate to="/j" replace />},
  {index: true,  element: <Navigate to="/behaviors" replace />},
]

export default routes
