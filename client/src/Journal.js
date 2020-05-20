import {Link, Route, Switch, useRouteMatch} from "react-router-dom"
import Entries from "./Entries"
import Entry from "./Entry"
import Fields from './Fields'
import React from "react"
import {Col, Row} from 'react-bootstrap'

export default function Journal({fetch_, as, setServerError}) {
  let match = useRouteMatch()

  return (
    <div>
      <Row>
        <Col>
          <Switch>
            <Route path={`${match.url}/entry/:entry_id`}>
              <Entry fetch_={fetch_} as={as} setServerError={setServerError} />
            </Route>
            {!as && (
              <Route path={`${match.url}/entry`}>
                <Entry fetch_={fetch_} as={as} setServerError={setServerError} />
              </Route>
            )}
            <Route path={match.url}>
              <Entries fetch_={fetch_} as={as} />
            </Route>
          </Switch>
        </Col>
        <Col lg={4}>
          <Fields fetch_={fetch_} as={as} />
        </Col>
      </Row>
    </div>
  )
}
