import React, {useEffect, useState} from "react";
import {Col, Form, Card, Button} from "react-bootstrap";
import {fetch_, spinner} from './utils'

export default function Query({jwt}) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [fetching, setFetching] = useState(false)

  const fetchAnswer = async (e) => {
    setFetching(true)
    e.preventDefault()
    const res = await fetch_('query', 'POST', {query}, jwt)
    setAnswer(res)
    setFetching(false)
  }

  const changeQuery = e => setQuery(e.target.value)

  return <>
    <Form onSubmit={fetchAnswer}>
     <Form.Group controlId="formQuery">
        <Form.Control
          as="textarea"
          lines={3}
          placeholder="Ask a question about yourself. Or enter a word, and see what associations come up."
          value={query}
          onChange={changeQuery}
        />
      </Form.Group>
      {fetching ? spinner : <Button
        variant="primary"
        type="submit"
      >Ask</Button>}
    </Form>
    {answer && (
      <Card style={{marginTop: 10}}>
        <Card.Body>
          <Card.Text>{answer}</Card.Text>
        </Card.Body>
      </Card>
    )}
  </>
}
