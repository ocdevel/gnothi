import {Link, Route, Switch, useRouteMatch, Redirect} from "react-router-dom"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import {fetch_, spinner} from './utils'
import ReactMarkdown from "react-markdown";
import {Table, Form, Button, Badge, Card} from 'react-bootstrap'

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
          <option>Partner</option>
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
              <option>Deceased</option>
              <option>Abandonment</option>
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

function Resources({jwt}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)

  const fetchBooks = async () => {
    setFetching(true)
    const res = await fetch_('books', 'GET', null, jwt)
    setBooks(res)
    setFetching(false)
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  return <>
    <h1>Books</h1>
    {fetching ? (
      <>
        {spinner}
        <p className='text-muted'>Loading book recommendations (1-10seconds)</p>
      </>
    ) : (
      <Table>
        <thead>
          <th>Author</th>
          <th>Title</th>
          <th>Description</th>
        </thead>
        <tbody>
          {books.map(b => <tr>
            <td>{b.author}</td>
            <td>{b.title}</td>
            <td>{b.text}</td>
          </tr>)}
        </tbody>
      </Table>
    )}
  </>
}

export default function Profile({jwt}) {
  let match = useRouteMatch()

  return (
    <Switch>
      <Route path={`${match.url}/sharing`}>
        <Sharing jwt={jwt} />
      </Route>
      <Route path={`${match.url}/family`}>
        <Family jwt={jwt} />
      </Route>
      <Route path={`${match.url}/resources`}>
        <Resources jwt={jwt} />
      </Route>
      <Redirect from={match.url} to={`${match.url}/sharing`} />
    </Switch>
  )
}
