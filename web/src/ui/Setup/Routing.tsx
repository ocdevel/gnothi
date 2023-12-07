import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Navigate,
  Outlet,
  useRouteError, useNavigate, useLocation
} from "react-router-dom";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useStore} from "../../data/store";
//import * as Sentry from "@sentry/react";

import {S, Error} from '../Components/Routing'


const SplashLayout = React.lazy( () => import("../Static/Splash/Layout"))
const Privacy = React.lazy(() => import("../Static/Privacy"))
const Terms = React.lazy(() => import("../Static/Terms"))
const Disclaimer = React.lazy(() => import("../Static/Disclaimer"))
const Home = React.lazy(() => import("../Static/Splash/Home"))
const Features = React.lazy(() => import("../Static/Splash/Features"))

const AppLayout = React.lazy(() => import("../App/Layout/Layout"))
const JournalLayout = React.lazy(() => import("../App/Entries/Layout"))
const BehaviorsLayout = React.lazy(() => import("../App/Behaviors/Layout"))
const Dashboard = React.lazy(() => import("../App/Entries/List"))
const Track = React.lazy(() => import("../App/Behaviors/Track/Track"))
const Analyze = React.lazy(() => import("../App/Behaviors/Analyze/Analyze"))

const GroupsLayout = React.lazy(() => import("../App/Groups/Layout"))
const GroupsList = React.lazy(() => import("../App/Groups/List/List.tsx"))
const Group = React.lazy(() => import("../App/Groups/View"))


const common = {
  errorElement: <Error />,
}

// const createBrowserRouter_ = Sentry.wrapCreateBrowserRouter(createBrowserRouter);
const createBrowserRouter_ = createBrowserRouter

const AUTH_ROUTES = ["j", "b", "g"]
function isAuthRoute(pathname: string) {
  const split = pathname.split("/").filter(Boolean)
  return split.length > 0 && AUTH_ROUTES.includes(split[0])
}

const router = createBrowserRouter_([{
  path: "/", element: <AuthWrapper />, ...common, children: [
    // Static
    {index: true, element: <S><Home /></S>},
    {path: "privacy", element: <S><Privacy /></S>, ...common},
    {path: "terms", element: <S><Terms /></S>, ...common},
    {path: "disclaimer", element: <S><Disclaimer /></S>, ...common},
    {path: "features", element: <S><Features /></S>, ...common},
    // {path: "about/:tab", element: <S><Details /></S>},

    // App (authenticated)
    {path: "j", ...common, element: <S><JournalLayout /></S>, children: [
      {index: true, ...common, element: <S><Dashboard /></S>},
      // {path: ":entry_id/:mode", ...defaults, element: <ModalRouter />},
    ]},
    {path: "b", ...common, element: <S><BehaviorsLayout /></S>, children: [
      {index: true, ...common, element: <S><Track /></S>},
      {path: "analyze", element: <S><Analyze /></S>}
    ]},
    {path: "g", ...common, element: <S><GroupsLayout /></S>, children: [
      {index: true, ...common, element: <S><GroupsList /></S>},
      {path: ":gid", element: <S><Group /></S>}
    ]},
  ]
}])

function AuthRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const authenticated = useStore(state => state.authenticated);

  // Immediately on first visit, store where they attempted to go. This way if auth kicks in, we can redirect
  // them to that route. We'll set this to NULL on very next navigation, indicating that (a) we're done, don't
  // do it again; or (b) they're bopping around splash pages, don't redirect on signup/signin
  const pathAfterAuth = useRef<string | null>(
    isAuthRoute(location.pathname) ? location.pathname
      : location.pathname === "/" ? "/j"
      : null
  )

  useEffect(() => {
    // we've cleared it since the task is done
    if (!pathAfterAuth.current) { return }

    if (authenticated) {
      const curr = pathAfterAuth.current
      pathAfterAuth.current = null
      navigate(curr, {replace: true})
    } else if (isAuthRoute(location.pathname)) {
      navigate("/", {replace: true})
    }
  }, [authenticated]);
  return null
}

function AuthWrapper() {
  const authenticated = useStore(state => state.authenticated);
  return <>
    <AuthRedirect />
    {authenticated
      ? <S><AppLayout /></S>
      : <S><SplashLayout /></S>}
  </>
}


export default function Routing() {
  return <RouterProvider router={router} />
}
