import {Link, Route, Switch, useRouteMatch} from "react-router-dom"
import Entries from "./Entries"
import Entry from "./Entry"
import Fields from './Fields'
import React from "react"
import {Col, Row} from 'react-bootstrap'
import {NotesAll} from './Notes'

export default function Journal() {
  let match = useRouteMatch()

  return (
    <div>
      <Row>
        <Col>
          <Route path={match.url}>
            <Entries />
          </Route>
        </Col>
        <Col lg={4}>
          <Fields  />
          <NotesAll />
        </Col>
      </Row>
    </div>
  )
}
