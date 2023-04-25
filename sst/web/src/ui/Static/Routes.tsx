import {Navigate} from "react-router-dom";
import React from "react";
import Privacy from "./Privacy"
import Terms from "./Terms"
import Disclaimer from "./Disclaimer"
// const Overviews = React.lazy( () => import("./Splash/Overviews"))
// const Details = React.lazy(() => import("./Splash/Details"))
import Features from "./Splash/Features"
import Home from "./Splash/Home"
import {S, Error} from '../Components/Routing'

export * as Static from './Routes'

export const staticRoutes = [
  {path: "privacy", element: <Privacy />},
  {path: "terms", element: <Terms />},
  {path: "disclaimer", element: <Disclaimer />}
]

export const splashRoutes = [
  {index: true, element: <Home />},
  {path: "features", element: <Features />},
  // {path: "about/:tab", element: <S><Details /></S>},
  {path: "j", element: <Navigate to="/" replace={true} />},
]
