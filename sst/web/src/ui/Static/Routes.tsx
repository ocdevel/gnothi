import {Navigate} from "react-router-dom";
import React from "react";
import Privacy from "./Privacy"
import Terms from "./Terms"
const Overviews = React.lazy( () => import("./Splash/Overviews"))
const Details = React.lazy(() => import("./Splash/Details"))
import {S, Error} from '../Components/Routing'

export * as Static from './Routes'

export const staticRoutes = [
  {path: "privacy", element: <S><Privacy /></S>},
  {path: "terms", element: <S><Terms /></S>}
]

export const splashRoutes = [
  {index: true, element: <S><Overviews /></S>},
  {path: "about/:tab", element: <S><Details /></S>},
  {path: "j", element: <Navigate to="/" replace={true} />},
]
