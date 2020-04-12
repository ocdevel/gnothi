import {Link, Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import {fetch_} from './utils'
import ReactMarkdown from "react-markdown";
import {Table, Form, Button, Badge} from 'react-bootstrap'

function Themes({jwt}) {
  return <h1>Themes</h1>
}

function Family({jwt}) {
  const [family, setFamily] = useState([])
  return <div>
    <h1>Family</h1>
    <Form>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Therapist Email address</Form.Label>
        <Form.Control type="email" placeholder="Enter email" />
        <Form.Text className="text-muted">
          Email of person you'll share data with
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="exampleForm.ControlSelect2">
        <Form.Label>Share</Form.Label>
        <Form.Control as="select" multiple>
          <option>Summaries</option>
          <option>Themes</option>
          <option>Sentiment</option>
          <option>Field Charts</option>
          <option>Family</option>
          <option>Entries (specified per entry)</option>
        </Form.Control>
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  </div>
}

function Sharing({jwt}) {
  return <div>
    <Form>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Therapist Email address</Form.Label>
        <Form.Control type="email" placeholder="Enter email" />
        <Form.Text className="text-muted">
          Email of person you'll share data with
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="exampleForm.ControlSelect2">
        <Form.Label>Share</Form.Label>
        <Form.Control as="select" multiple>
          <option>Summaries</option>
          <option>Themes</option>
          <option>Sentiment</option>
          <option>Field Charts</option>
          <option>Family</option>
          <option>Entries (specified per entry)</option>
        </Form.Control>
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
    <hr/>
    <div>
      <p>Sharing with:</p>
      <Badge variant="secondary">megantherapy@gmail.com x</Badge><br/>
      <Badge variant="secondary">lisarenelle@gmail.com x</Badge>
    </div>
  </div>
}

function Association({jwt}) {
  return <h1>Association</h1>
}

function Resources({jwt}) {
  return <h1>Resources</h1>
}

export default function Profile({jwt}) {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/themes`}>
        <Themes jwt={jwt} />
      </Route>
      <Route path={`${match.url}/family`}>
        <Family jwt={jwt} />
      </Route>
      <Route path={`${match.url}/sharing`}>
        <Sharing jwt={jwt} />
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
