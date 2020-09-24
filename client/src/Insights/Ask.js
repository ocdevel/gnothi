import React, {useEffect, useState} from "react";
import {Col, Form, Card, Button, Alert} from "react-bootstrap";
import {spinner, trueKeys} from '../utils'

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'

export default function Ask() {
  const [query, setQuery] = useState('')
  const [answers, setAnswers] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)

  const days = useSelector(state => state.days)
  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)
  const dispatch = useDispatch()

  if (notShared) {return <h5>{notShared}</h5>}

  const fetchAnswer = async (e) => {
    setFetching(true)
    e.preventDefault()
    const body = {query, days}
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
        {/*<Form.Label for='question-answering'>Question</Form.Label>*/}
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
      {fetching ? spinner : <>
        <Button
          disabled={aiStatus !== 'on'}
          variant="primary"
          type="submit"
        >Ask</Button>
      </>}
    </Form>
    {renderAnswers()}
  </>
}
