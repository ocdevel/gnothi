import {Link, Route, Switch, useRouteMatch} from "react-router-dom"
import Entries from "./Entries"
import Entry from "./Entry"
import Fields from './Fields'
import Query from './Query'
import Summarize from './Summarize'
import React from "react"
import {Col, Row} from 'react-bootstrap'

export default function Journal({fetch_}) {
  let match = useRouteMatch()

  return (
    <div>
      <Row>
        <Col>
          <Switch>
            <Route path={`${match.url}/entry/:entry_id`}>
              <Entry fetch_={fetch_} />
            </Route>
            <Route path={`${match.url}/entry`}>
              <Entry fetch_={fetch_} />
            </Route>
            <Route path={match.url}>
              <Entries fetch_={fetch_} />
            </Route>
          </Switch>
        </Col>
        <Col lg={3}>
          <Fields fetch_={fetch_} />
          <hr />
          <Summarize fetch_={fetch_} />
          <hr />
          <Query fetch_={fetch_} />
        </Col>
      </Row>
    </div>
  )
}
