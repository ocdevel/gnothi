import {Link, Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import {fetch_} from './utils'
import ReactMarkdown from "react-markdown";
import {Table} from 'react-bootstrap'

function Causation({jwt}) {
  const [targets, setTargets] = useState({})
  const [fields, setFields] = useState([])

  const f_map = _.transform(fields, (m, v, k) => {
    m[v.id] = v
  }, {})

  const fetchTargets = async () => {
    let res = await fetch_('fields', 'GET', null, jwt)
    setFields(res.fields)
    res = await fetch_('causation', 'GET', null, jwt)
    setTargets(res)
  }

  useEffect(() => {
    fetchTargets()
  }, [])

  return <>
    <h1>Field Effects</h1>
    {_.map(targets, (importances, target) => <>
      <h4>{f_map[target].name}</h4>
      <Table striped size="sm">
        <thead>
          <tr>
            <th>Importance</th>
            <th>Field</th>
          </tr>
        </thead>
        <tbody>
          {_(importances).toPairs().orderBy(x => -x[1]).map(x => <tr>
            <td>{x[1]}</td>
            <td><ReactMarkdown source={f_map[x[0]].name} /></td>
          </tr>).value()}
        </tbody>
      </Table>
    </>)}
  </>
}

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
      <Route path={`${match.url}/causation`}>
        <Causation jwt={jwt} />
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
