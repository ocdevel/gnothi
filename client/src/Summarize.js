import React, {useState} from 'react'
import {Form, InputGroup, Button} from "react-bootstrap"
import {spinner, trueKeys, sent2face, AiStatusMsg} from "./utils"
import ForXDays from "./ForXDays"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from './redux/actions'

export default function Summarize() {
  const [fetching, setFetching] = useState(false)
  const [res, setRes] = useState({summary: '', sentiment: ''})
  const [form, setForm] = useState({days: 14, words: 300})
  const [notShared, setNotShared] = useState(false)
  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)

  const dispatch = useDispatch()

  if (notShared) {return <h5>{notShared}</h5>}

  const submit = async e => {
    setFetching(true)
    e.preventDefault();
    const tags_ = trueKeys(selectedTags)
    const body = {...form}
    if (tags_.length) { body.tags = tags_ }
    const {data, code, message} = await dispatch(fetch_('summarize', 'POST', body))
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setRes(data)
  }

  return <Form onSubmit={submit}>
    <ForXDays
      setForm={setForm}
      form={form}
      feature={'summarization'}
    />
    {fetching ? spinner : <>
      <Button
        disabled={aiStatus !== 'on'}
        type="submit"
        variant="primary"
        className='bottom-margin'
      >Submit</Button>
      <AiStatusMsg status={aiStatus} />
    </>}
    {res.summary && <>
      <hr/>
      <p>
        {sent2face(res.sentiment)} {res.summary}
      </p>
    </>}
  </Form>
}
