import {Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React from "react"
import Resources from "./Resources"
import Family from "./Family"
import Sharing from "./Sharing"

export default function Profile({jwt}) {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/sharing`}>
        <Sharing jwt={jwt} />
      </Route>
      <Route path={`${match.url}/family`}>
        <Family jwt={jwt} />
      </Route>
      <Route path={`${match.url}/resources`}>
        <Resources jwt={jwt} />
      </Route>
      <Redirect from={match.url} to={`${match.url}/sharing`} />
    </Switch>
  )
}
