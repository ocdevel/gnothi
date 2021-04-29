import React, {useState, useEffect} from 'react'
import {Form, InputGroup, Button, Col} from "react-bootstrap"
import {sent2face} from "../Helpers/utils"
import {Spinner} from "./utils"

import {useStoreState, useStoreActions} from "easy-peasy";

export default function Summarize() {
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)
  const res = useStoreState(s => s.ws.res['insights/summarize/post'])
  const job = useStoreState(s => s.ws.data['insights/summarize/post'])
  const form = useStoreState(s => s.insights.summarize)
  const reply = useStoreState(s => s.ws.data['insights/summarize/get'])
  const a = useStoreActions(a => a.insights)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (res) {setWaiting(true)}
  }, [res])
  useEffect(() => {
    if (reply) {setWaiting(false)}
  }, [reply])

  if (res?.code === 403) { return <h5>{res.detail}</h5> }

  const changeWords = e => {
    a.setInsight(['summarize', e.target.value])
  }

  function submit(e) {
    e.preventDefault();
    a.postInsight('summarize')
  }


  const renderForm = () => (
    <Form.Group as={Col}>
      <Form.Label for={`xWords`} srOnly>Summarize in how many words</Form.Label>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>#Words</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          id={`xWords`}
          type="number"
          min={5}
          value={form}
          onChange={changeWords}
        />
      </InputGroup>
      <Form.Text muted>
        How many words to summarize this time-range into. Try 100 if you're in a hurry; 300 is a sweet-spot.
      </Form.Text>
    </Form.Group>
  )

  function renderReply() {
    const reply_ = reply?.[0]
    if (!reply_) {return null}
    if (!reply_.summary) {
      return <p>Nothing to summarize (try adjusting date range)</p>
    }
    return <>
      <hr/>
      <p>{sent2face(reply_.sentiment)} {reply_.summary}</p>
    </>
  }

  return <>
    {renderForm()}
    <Form onSubmit={submit}>
      {waiting ? <Spinner job={job} /> : <>
        <Button
          disabled={aiStatus !== 'on'}
          type="submit"
          variant="primary"
          className='mb-3'
        >Submit</Button>
      </>}
      {renderReply()}
    </Form>
  </>
}
