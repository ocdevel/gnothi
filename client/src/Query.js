import React, {useEffect, useState} from "react";
import {Col, Form, Card, Button} from "react-bootstrap";
import {spinner} from './utils'

export default function Query({fetch_}) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)

  if (notShared) {return <h5>{notShared}</h5>}

  const fetchAnswer = async (e) => {
    setFetching(true)
    e.preventDefault()
    const {data, code, message} = await fetch_('query', 'POST', {query})
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setAnswer(data)
  }

  const changeQuery = e => setQuery(e.target.value)

  return <>
    <Form onSubmit={fetchAnswer}>
     <Form.Group controlId="formQuery">
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Ask a question about yourself. Use proper grammar, it makes a difference."
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
