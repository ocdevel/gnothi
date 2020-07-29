import {Form, InputGroup, Col} from "react-bootstrap";
import React from "react";

export default function ForXDays({setForm, form, feature}) {
  // feature = question-answering|summarization|themes|resources
  const changeField = k => e => setForm({...form, [k]: e.target.value})

  return <>
  <Form.Row>
    <Form.Group as={Col}>
      <Form.Label for={`x-days-${feature}`}>Number of days</Form.Label>
      <InputGroup>
        <Form.Control
          id={`x-days-${feature}`}
          type="number"
          min={1}
          value={form.days}
          onChange={changeField('days')}
        />
        <InputGroup.Append>
          <InputGroup.Text>Days</InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
      <Form.Text muted>
        Number of days' worth of entries (from today) to include. Eg, 7 if you're checking weekly.
      </Form.Text>
    </Form.Group>
    {feature === 'summarization' && <>
      <Form.Group as={Col}>
        <Form.Label for={`x-words-${feature}`}>In how many words</Form.Label>
        <InputGroup>
          <Form.Control
            id={`x-words-${feature}`}
            type="number"
            min={5}
            value={form.words}
            onChange={changeField('words')}
          />
          <InputGroup.Append>
            <InputGroup.Text>Words</InputGroup.Text>
          </InputGroup.Append>
        </InputGroup>
        <Form.Text muted>
          How many words to summarize this time-range into. Try 100 if you're in a hurry; 300 is a sweet-spot.
        </Form.Text>
      </Form.Group>
    </>}
    </Form.Row>
  </>
}