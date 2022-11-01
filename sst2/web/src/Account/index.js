import {Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React from "react"
import Profile from "./Profile"

export default function Account() {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/profile`}>
        <Profile />
      </Route>
      {/*<Route path={`${match.url}/sharing`}>
        <Sharing />
      </Route>*/}
    </Switch>
  )
}
