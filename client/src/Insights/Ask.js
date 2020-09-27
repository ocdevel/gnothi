import React, {useEffect, useState} from "react";
import {Col, Form, Card, Button, Alert} from "react-bootstrap";
import {spinner} from './utils'

import { useSelector, useDispatch } from 'react-redux'
import { getInsights, setInsights } from '../redux/actions'

export default function Ask() {
  const aiStatus = useSelector(state => state.aiStatus)
  const insights = useSelector(state => state.insights)
  const dispatch = useDispatch()

  const {ask_req, ask_fetching, ask_res} = insights
  const {code, message, data: answers} = ask_res

  if (code === 401) { return <h5>{message}</h5> }

  const fetchAnswer = async (e) => {
    e.preventDefault()
    if (!ask_req.length) {return}
    dispatch(getInsights('ask'))
  }

  const changeQuestion = e => dispatch(setInsights({'ask_req': e.target.value}))

  return <>
    <Form onSubmit={fetchAnswer}>
      <Form.Group controlId="formQuery">
        {/*<Form.Label for='question-answering'>Question</Form.Label>*/}
        <Form.Control
          id='question-answering'
          placeholder="How do I feel about x?"
          as="textarea"
          rows={3}
          value={ask_req}
          onChange={changeQuestion}
        />
        <Form.Text muted>
           Use proper English & grammar. Use personal pronouns.
        </Form.Text>
      </Form.Group>
      {ask_fetching ? spinner : <>
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
        <Card className='bottom-margin'>
          <Card.Body>
            <Card.Text>{a.answer}</Card.Text>
          </Card.Body>
        </Card>
      </>)}
    </>}
  </>
}
