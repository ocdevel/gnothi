import React, {useState} from 'react'
import {Form, InputGroup, Button, Col} from "react-bootstrap"
import {sent2face} from "../utils"
import {Spinner} from "./utils"

import { useSelector, useDispatch } from 'react-redux'
import { getInsights, setInsights } from '../redux/actions'

export default function Summarize() {
  const aiStatus = useSelector(state => state.aiStatus)
  const insights = useSelector(state => state.insights)
  const dispatch = useDispatch()

  const {summarize_req, summarize_res1, summarize_res2, summarize_fetching} = insights
  const {code, message, data} = summarize_res2

  if (code === 401) { return <h5>{message}</h5> }

  const changeWords = e => {
    dispatch(setInsights({'summarize_req': e.target.value}))
  }

  const submit = async e => {
    e.preventDefault();
    dispatch(getInsights('summarize'))
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
          value={summarize_req}
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
      {summarize_fetching ? <Spinner job={summarize_res1} /> : <>
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
