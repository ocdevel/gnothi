import React, {useState} from 'react'
import {Form, InputGroup, Button} from "react-bootstrap"
import {spinner, trueKeys, sent2face} from "./utils"
import ForXDays from "./ForXDays"

export default function Summarize({fetch_, as, tags}) {
  const [fetching, setFetching] = useState(false)
  const [res, setRes] = useState({summary: '', sentiment: ''})
  const [form, setForm] = useState({days: 14, words: 300})
  const [notShared, setNotShared] = useState(false)

  if (notShared) {return <h5>{notShared}</h5>}

  const submit = async e => {
    setFetching(true)
    e.preventDefault();
    const tags_ = trueKeys(tags)
    const body = {...form}
    if (tags_.length) { body['tags'] = tags_ }
    const {data, code, message} = await fetch_('summarize', 'POST', body)
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
    {fetching ? spinner : <Button type="submit" variant="primary" className='bottom-margin'>Submit</Button>}
    {res && <>
      <hr/>
      <p>
        {sent2face(res.sentiment)} {res.summary}
      </p>
    </>}
  </Form>
}
