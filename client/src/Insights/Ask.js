import React, {useEffect, useState} from "react";
import {Col, Form, Card, Button, Alert} from "react-bootstrap";
import {Spinner} from './utils'

import {useStoreActions, useStoreState} from "easy-peasy";

export default function Ask() {
  const aiStatus = useStoreState(state => state.server.ai)
  const insight = useStoreState(state => state.insights.ask)
  const getInsight = useStoreActions(actions => actions.insights.getInsight)
  const setInsight = useStoreActions(actions => actions.insights.setInsight)

  const {req, fetching, res1, res2} = insight
  const {code, message, data: answers} = res2

  if (code === 401) { return <h5>{message}</h5> }

  const fetchAnswer = async (e) => {
    e.preventDefault()
    if (!req.length) {return}
    getInsight('ask')
  }

  const changeQuestion = e => setInsight(['ask', {req: e.target.value}])

  return <>
    <Form onSubmit={fetchAnswer}>
      <Form.Group controlId="formQuery">
        {/*<Form.Label for='question-answering'>Question</Form.Label>*/}
        <Form.Control
          id='question-answering'
          placeholder="How do I feel about x?"
          as="textarea"
          rows={3}
          value={req}
          onChange={changeQuestion}
        />
        <Form.Text muted>
           Use proper English & grammar. Use personal pronouns.
        </Form.Text>
      </Form.Group>
      {fetching ? <Spinner job={res1} /> : <>
        <Button
          disabled={aiStatus !== 'on'}
          variant="primary"
          type="submit"
        >Ask</Button>
      </>}
    </Form>
    {answers && answers.length && <>
      <hr/>
      {answers.map((a, i) => <>
        <Card className='mb-3'>
          <Card.Body>
            <Card.Text>{a.answer}</Card.Text>
          </Card.Body>
        </Card>
      </>)}
    </>}
  </>
}
