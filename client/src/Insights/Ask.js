import React, {useEffect, useState} from "react";
import {Form, Card, Button} from "react-bootstrap";
import {Spinner} from './utils'

import {useStoreActions, useStoreState} from "easy-peasy";

export default function Ask() {
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)
  const res = useStoreState(s => s.ws.res['insights/question/post'])
  const job = useStoreState(s => s.ws.data['insights/question/post'])
  const form = useStoreState(s => s.insights.question)
  const reply = useStoreState(s => s.ws.data['insights/question/get'])
  const a = useStoreActions(a => a.insights)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (res) {setWaiting(true)}
  }, [res])
  useEffect(() => {
    if (reply) {setWaiting(false)}
  }, [reply])

  if (res?.code === 403) { return <h5>{res.detail}</h5> }

  function submit(e) {
    e.preventDefault()
    if (!form.length) {return}
    a.postInsight('question')
  }

  const changeQuestion = e => a.setInsight(['question', e.target.value])

  return <>
    <Form onSubmit={submit}>
      <Form.Group controlId="question-form">
        {/*<Form.Label for='question-answering'>Question</Form.Label>*/}
        <Form.Control
          placeholder="How do I feel about x?"
          as="textarea"
          rows={3}
          value={form}
          onChange={changeQuestion}
        />
        <Form.Text muted>
           Use proper English & grammar. Use personal pronouns.
        </Form.Text>
      </Form.Group>
      {waiting ? <Spinner job={job} /> : <>
        <Button
          disabled={aiStatus !== 'on'}
          variant="primary"
          type="submit"
        >Ask</Button>
      </>}
    </Form>
    {reply?.length && <>
      <hr/>
      {reply.map((a, i) => <>
        <Card className='mb-3'>
          <Card.Body>
            <Card.Text>{a.answer}</Card.Text>
          </Card.Body>
        </Card>
      </>)}
    </>}
  </>
}
