import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Navigate,
  Outlet,
  useRouteError
} from "react-router-dom";
import React, {useEffect} from "react";
import {useStore} from "../../data/store";

import {S, Error} from '../Components/Routing'
import * as StaticRoutes from '../Static/Routes'
import appRoutes from '../App/Routes'

const SplashLayout = React.lazy( () => import("../Static/Splash/Layout"))
const AppLayout = React.lazy(() => import("../App/Layout/Layout"))

const common = {
  errorElement: <Error />,
}

const routerAuthed = createBrowserRouter([{
  path: "/",
  element: <S><AppLayout /></S>,
  ...common,
  children: [
    ...StaticRoutes.staticRoutes,
    ...appRoutes
  ]
}])

const routerAnon = createBrowserRouter([{
  path: "/",
  element: <S><SplashLayout /></S>,
  ...common,
  children: [
    ...StaticRoutes.staticRoutes,
    ...StaticRoutes.splashRoutes,
  ]
}])

export default function Routing({children}: React.PropsWithChildren) {
  const authenticated = useStore(state => state.authenticated);
  const router = authenticated ? routerAuthed : routerAnon
  return <RouterProvider router={router} />
}
