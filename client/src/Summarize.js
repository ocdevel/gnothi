import React, {useState} from 'react'
import {Form, InputGroup, Button} from "react-bootstrap";
import {spinner} from "./utils";

export default function Summarize({fetch_}) {
  const [fetching, setFetching] = useState(false)
  const [summary, setSummary] = useState('')
  const [form, setForm] = useState({days: 7, words: 30})
  const [notShared, setNotShared] = useState(false)

  if (notShared) {return <h5>{notShared}</h5>}

  const submit = async e => {
    setFetching(true)
    e.preventDefault();
    const {data, code, message} = await fetch_('summarize', 'POST', form)
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setSummary(data.summary)
  }


  const changeField = k => e => setForm({...form, [k]: e.target.value})

  return <Form onSubmit={submit}>
    <Form.Group controlId="summarizeDays">
      <Form.Label>Summarize</Form.Label>
      <InputGroup>
        <Form.Control
          type="number"
          min={1}
          value={form.days}
          onChange={changeField('days')}
        />
        <InputGroup.Append>
          <InputGroup.Text id="inputGroupPrepend">Days</InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
      <Form.Label>In</Form.Label>
      <InputGroup>
        <Form.Control
          type="number"
          min={5}
          value={form.words}
          onChange={changeField('words')}
        />
        <InputGroup.Append>
          <InputGroup.Text id="inputGroupPrepend">Words</InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
    </Form.Group>
    {fetching ? spinner : <Button type="submit" variant="primary">Submit</Button>}
    {summary && <p>{summary}</p>}
  </Form>
}
