import {Route, Switch, useRouteMatch} from "react-router-dom"
import Entries from "./Entries"
import Entry from "./Entry"
import React from "react"

export default function Journal({jwt}) {
  let match = useRouteMatch()

  console.log(match.url)

  return (
    <Switch>
      <Route path={`${match.url}/entry/:entry_id`}>
        <Entry jwt={jwt} />
      </Route>
      <Route path={`${match.url}/entry`}>
        <Entry jwt={jwt} />
      </Route>
      <Route path={match.url}>
        <Entries jwt={jwt} />
      </Route>
    </Switch>
  )
}
