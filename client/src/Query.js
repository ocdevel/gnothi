import React, {useEffect, useState} from "react";
import {Col, Form, Card, Button, Alert} from "react-bootstrap";
import {spinner, AiStatusMsg, trueKeys} from './utils'
import ForXDays from "./ForXDays"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from './redux/actions'

export default function Query() {
  const [query, setQuery] = useState('')
  const [answers, setAnswers] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [form, setForm] = useState({days: 200})

  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)
  const dispatch = useDispatch()

  if (notShared) {return <h5>{notShared}</h5>}

  const fetchAnswer = async (e) => {
    setFetching(true)
    e.preventDefault()
    const body = {query, ...form}
    const tags_ = trueKeys(selectedTags)
    if (tags_.length) { body.tags = tags_ }
    const {data, code, message} = await dispatch(fetch_('query', 'POST', body))
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setAnswers(data)
  }

  const changeQuery = e => setQuery(e.target.value)

  const renderAnswers = () => {
    const n_answers = answers.length
    if (n_answers === 0) {return null}
    return <>
      <hr/>
      {n_answers > 1 && <>
        <Alert variant='info'>Too many entries, splitting into chunks by time period.</Alert>
      </>}
      {answers.map((a, i) => <>
        <Card style={{marginTop: 10}}>
          <Card.Body>
            <Card.Text>{a.answer}</Card.Text>
          </Card.Body>
        </Card>
      </>)
      }
    </>
  }

  return <>
    <Form onSubmit={fetchAnswer}>
      <Form.Group controlId="formQuery">
        <Form.Label for='question-answering'>Question</Form.Label>
        <Form.Control
          id='question-answering'
          placeholder="How do I feel about x?"
          as="textarea"
          rows={3}
          value={query}
          onChange={changeQuery}
        />
        <Form.Text muted>
           Use proper English & grammar. Use personal pronouns.
        </Form.Text>
      </Form.Group>
      <ForXDays
        form={form}
        setForm={setForm}
        feature={'question-answering'}
      />
      {fetching ? spinner : <>
        <Button
          disabled={aiStatus !== 'on'}
          variant="primary"
          type="submit"
        >Ask</Button>
        <AiStatusMsg status={aiStatus} />
      </>}
    </Form>
    {renderAnswers()}
  </>
}
