import React, {useState} from 'react'
import {Form, InputGroup, Button, Col} from "react-bootstrap"
import {sent2face} from "../utils"
import {Spinner} from "./utils"

import {useStoreState, useStoreActions} from "easy-peasy";

export default function Summarize() {
  const aiStatus = useStoreState(state => state.server.ai)
  const insight = useStoreState(state => state.insights.summarize)
  const setInsight = useStoreActions(actions => actions.insights.setInsight)
  const getInsight = useStoreActions(actions => actions.insights.getInsight)

  const {req, res1, res2, fetching} = insight
  const {code, message, data} = res2

  if (code === 401) { return <h5>{message}</h5> }

  const changeWords = e => {
    setInsight(['summarize', {req: e.target.value}])
  }

  const submit = async e => {
    e.preventDefault();
    getInsight('summarize')
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
          value={req}
          onChange={changeWords}
        />
      </InputGroup>
      <Form.Text muted>
        How many words to summarize this time-range into. Try 100 if you're in a hurry; 300 is a sweet-spot.
      </Form.Text>
    </Form.Group>
  )


  return <>
    {renderForm()}
    <Form onSubmit={submit}>
      {fetching ? <Spinner job={res1} /> : <>
        <Button
          disabled={aiStatus !== 'on'}
          type="submit"
          variant="primary"
          className='mb-3'
        >Submit</Button>
      </>}
      {data && <>
        <hr/>
        <p>{sent2face(data.sentiment)} {data.summary}</p>
      </>}
    </Form>
  </>
}
