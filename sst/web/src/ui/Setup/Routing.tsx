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
const SplashLayout = React.lazy( () => import("../Static/Splash/Layout"))
const AppLayout = React.lazy(() => import("../App/Layout/Layout"))
import appRoutes from '../App/Routes'

const routerAuthed = createBrowserRouter([
  {
    path: "/",
    element: <S>
      <Init />
      <AppLayout />
    </S>,
    errorElement: <Error />,
    children: [
      {
        errorElement: <Error />,
        children: [
          {path: "about", errorElement: <Error />, children: [
            ...StaticRoutes.staticRoutes
          ]},
          ...appRoutes
        ]
      },
    ]
  }
])

const routerAnon = createBrowserRouter([
  {
    path: "/",
    element: <S>
      <Init />
      <SplashLayout />
    </S>,
    errorElement: <Error />,
    children: [{
      errorElement: <Error />,
      children: [
        ...StaticRoutes.staticRoutes,
        ...StaticRoutes.splashRoutes,
      ]
    }]
  }
])

export default function Routing() {
  const jwt = useStore(state => state.jwt);
  const router = jwt ? routerAuthed : routerAnon
  return <RouterProvider router={router} />
}
