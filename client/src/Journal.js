import {Link, Route, Switch, useRouteMatch} from "react-router-dom"
import Entries from "./Entries"
import Entry from "./Entry"
import Fields from './Fields'
import React from "react"
import {Col, Row} from 'react-bootstrap'

export default function Journal({jwt}) {
  let match = useRouteMatch()

  return (
    <div>
      <Row>
        <Col lg={3}>
          <Fields jwt={jwt} />
        </Col>
        <Col>
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
          </Col>
      </Row>
    </div>
  )
}
