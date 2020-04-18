import {Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React from "react"
import Family from "./Family"
import Sharing from "./Sharing"

export default function Profile({fetch_, as}) {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/sharing`}>
        <Sharing fetch_={fetch_} as={as} />
      </Route>
      <Route path={`${match.url}/family`}>
        <Family fetch_={fetch_} />
      </Route>
    </Switch>
  )
}
