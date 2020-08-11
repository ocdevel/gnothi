import {Link, Route, Switch, useRouteMatch} from "react-router-dom"
import Entries from "./Entries"
import Entry from "./Entry"
import Fields from './Fields'
import React from "react"
import {Col, Row} from 'react-bootstrap'

export default function Journal({fetch_, as, setServerError, aiStatus}) {
  let match = useRouteMatch()

  return (
    <div>
      <Row>
        <Col>
          <Route path={match.url}>
            <Entries fetch_={fetch_} as={as} aiStatus={aiStatus} setServerError={setServerError}/>
          </Route>
        </Col>
        <Col lg={4}>
          <Fields fetch_={fetch_} as={as} />
        </Col>
      </Row>
    </div>
  )
}
