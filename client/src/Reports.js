import {Link, Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import {fetch_} from './utils'
import ReactMarkdown from "react-markdown";
import {Table} from 'react-bootstrap'

function Themes({jwt}) {
  return <h1>Themes</h1>
}

function Summaries({jwt}) {
  return <h1>Summaries</h1>
}

function Association({jwt}) {
  return <h1>Association</h1>
}

function Resources({jwt}) {
  return <h1>Resources</h1>
}

export default function Reports({jwt}) {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/themes`}>
        <Themes jwt={jwt} />
      </Route>
      <Route path={`${match.url}/summaries`}>
        <Summaries jwt={jwt} />
      </Route>
      <Route path={`${match.url}/association`}>
        <Association jwt={jwt} />
      </Route>
      <Route path={`${match.url}/resources`}>
        <Resources jwt={jwt} />
      </Route>
      <Redirect from={match.url} to={`${match.url}/themes`} />
    </Switch>
  )
}
