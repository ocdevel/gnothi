import React, {useState} from 'react'
import {Form, InputGroup, Button, Col} from "react-bootstrap"
import {spinner, trueKeys, sent2face} from "../utils"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'

export default function Summarize() {
  const [fetching, setFetching] = useState(false)
  const [res, setRes] = useState({summary: '', sentiment: ''})
  const [form, setForm] = useState({days: 14, words: 300})
  const [notShared, setNotShared] = useState(false)
  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)
  const days = useSelector(state => state.days)

  const dispatch = useDispatch()

  if (notShared) {return <h5>{notShared}</h5>}

  const changeField = k => e => setForm({...form, [k]: e.target.value})

  const submit = async e => {
    setFetching(true)
    e.preventDefault();
    const tags_ = trueKeys(selectedTags)
    const body = {days, ...form}
    if (tags_.length) { body.tags = tags_ }
    const {data, code, message} = await dispatch(fetch_('summarize', 'POST', body))
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setRes(data)
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
          value={form.words}
          onChange={changeField('words')}
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
      {fetching ? spinner : <>
        <Button
          disabled={aiStatus !== 'on'}
          type="submit"
          variant="primary"
          className='bottom-margin'
        >Submit</Button>
      </>}
      {res.summary && <>
        <hr/>
        <p>
          {sent2face(res.sentiment)} {res.summary}
        </p>
      </>}
    </Form>
  </>
}
