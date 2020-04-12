import {Link, Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import {fetch_} from './utils'
import ReactMarkdown from "react-markdown";
import {Table, Form, Button, Badge, Card} from 'react-bootstrap'

function Themes({jwt}) {
  const [topics, setTopics] = useState({})

  const fetchTopics = async () => {
    const res = await fetch_('gensim', 'GET', null, jwt)
    setTopics(res)
  }

  useEffect(() => {fetchTopics()}, [])

  return <>
    <h1>Themes</h1>
    {_.map(topics, (words, topic)=>(
      <Card>
        <Card.Body>
          <Card.Title>Topic {topic}</Card.Title>
          {/*<Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle>*/}
          <Card.Text>
            {words.join(', ')}
          </Card.Text>
        </Card.Body>
      </Card>
    ))}
  </>
}

function Family({jwt}) {
  const [form, setForm] = useState({})
  const [family, setFamily] = useState([
    {name: 'Tyler', type: 'Self', issues: ['Depression']},
    {name: 'Susan', type: 'Mother'},
    {name: 'Robert', type: 'Father'},
  ])

  const addFamily = e => {
    e.preventDefault();
    family.push(form)
    setFamily(family)
    setForm({name: '', type: 'Self'})
  }

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }


  return <div>
    <h1>Family</h1>
    <Form onSubmit={addFamily}>
      <Form.Group controlId="formFamilyName">
        <Form.Label>Family Member Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Susan"
          value={form.name}
          onChange={changeForm('name')}
        />
      </Form.Group>

      <Form.Group controlId="formFamilyType">
        <Form.Label>Family Role</Form.Label>
        <Form.Control
          as="select"
          onChange={changeForm('type')}
          value={form.type}
        >
          <option>Self</option>
          <option>Mother</option>
          <option>Father</option>
          <option>Brother</option>
          <option>Sister</option>
          <option>Grandmother</option>
          <option>Grandfather</option>
          <option>Great Grandfather</option>
          <option>Great Grandmother</option>
          <option>Aunt</option>
          <option>Uncle</option>
          <option>Child</option>
          <option>Grandchild</option>
        </Form.Control>
      </Form.Group>

      <Button variant="success" type="submit">Add</Button>
    </Form>

    <Table>
      <thead>
        <th>Name</th>
        <th>Type</th>
        <th>Issues</th>
      </thead>
      <tbody>
      {family.map(f => <tr>
        <td>{f.name}</td>
        <td>{f.type}</td>
        <td>
          <Form.Group controlId="exampleForm.ControlSelect2">
            <Form.Control
              as="select"
              multiple
              value={f.issues}
              onChange={changeForm('issues')}
            >
              <option>Depression</option>
              <option>Alcoholism</option>
              <option>Avoidant attachment</option>
              <option>Anxious attachment</option>
              <option>Abuse</option>
              <option>Bipolar</option>
            </Form.Control>
          </Form.Group>
        </td>
      </tr>)}
      </tbody>
    </Table>
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
