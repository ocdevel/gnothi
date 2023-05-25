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
import Init from './Init'
import * as StaticRoutes from '../Static/Routes'
import appRoutes from '../App/Routes'

const SplashLayout = React.lazy( () => import("../Static/Splash/Layout"))
const AppLayout = React.lazy(() => import("../App/Layout/Layout"))

const common = {errorElement: <Error />}

const routerAuthed = createBrowserRouter([{
  path: "/",
  element: <S>
    <Init />
    <AppLayout />
  </S>,
  ...common,
  children: [
    ...StaticRoutes.staticRoutes,
    ...appRoutes
  ]
}])

const routerAnon = createBrowserRouter([{
  path: "/",
  element: <S>
    <Init />
    <SplashLayout />
  </S>,
  ...common,
  children: [
    ...StaticRoutes.staticRoutes,
    ...StaticRoutes.splashRoutes,
  ]
}])

export default function Routing() {
  const jwt = useStore(state => state.jwt);
  const router = jwt ? routerAuthed : routerAnon
  return <RouterProvider router={router} />
}
