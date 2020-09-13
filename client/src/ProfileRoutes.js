import {Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React from "react"
import Profile from "./Profile"
import People from "./People"
import Sharing from "./Sharing"

export default function ProfileRoutes() {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/profile`}>
        <Profile />
      </Route>
      <Route path={`${match.url}/people`}>
        <People />
      </Route>
      <Route path={`${match.url}/sharing`}>
        <Sharing />
      </Route>
    </Switch>
  )
}
