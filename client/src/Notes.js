import {Accordion, Badge, Button, Card, Col, Form, Row, useAccordionToggle} from "react-bootstrap";
import _ from "lodash";
import React, {useEffect, useState} from "react";

export function NotesAll({fetch_, as}) {
  const [notes, setNotes] = useState([])
  const fetchNotes = async () => {
    const {data} = await fetch_(`notes`, 'GET')
    setNotes(data)
  }
  useEffect(() => {
    fetchNotes()
  }, [as])

  if (!notes.length) {return null}
  return <>
    <h5>Notes</h5>
    {notes.map(n => <>
      <Badge variant="primary">{n.type}</Badge>{' '}
      {n.private ? "[private] " : null}
      {n.text}
      <hr/>
    </>)}
  </>
}

function CustomToggle({ children, eventKey }) {
  const decoratedOnClick = useAccordionToggle(eventKey, _.noop)

  return (
    <span className='anchor' onClick={decoratedOnClick}>
      {children}
    </span>
  );
}

export function Notes({fetch_, as, entry_id}) {
  const [notes, setNotes] = useState([])
  const [adding, setAdding] = useState(null)
  const [text, setText] = useState('')
  const [private_, setPrivate] = useState(false)

  const fetchNotes = async () => {
    const {data} = await fetch_(`entries/${entry_id}/notes`, 'GET')
    setNotes(data)
  }

  useEffect(() => {
    fetchNotes()
  }, [entry_id])

  const noteTypes = [{
    key: 'label',
    name: "Label",
    accordion: [{
      title: "Journal owner",
      body: [
        "CBT & Zen promote labeling your thoughts as an objective observer. It helps you get outside your emotions and assess your thoughts, which has positive cognitive impact.",
        "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
        "Might help therapists assess your entries."
      ]
    }, {
      title: "Therapists",
      body: [
        "Can serve as mini note-taking on entries.",
        "Helps AI recommend resources to this client."
      ]
    }]
  }, {
    key: 'note',
    name: "Note",
    accordion: [{
      title: "Journal owner",
      body: [
        "CBT & Zen promote describing your thoughts as an objective observer. It helps you get outside your emotions and assess your thoughts, which has positive cognitive impact. The dispassionate details, the better the effect.",
        "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
        "Might help therapists assess your entries.",
      ]
    }, {
      title: "Therapists",
      body: [
        "For private notes, consider this an organized note-taking feature for your clients. Private notes will also appear in the sidebar, so you can recall your notes before your session.",
        "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
        "Non-private notes can serve as communication with the client: advice, support, or helping them understand their entries from your perspective.",
      ]
    }]
  }, {
    key: 'resource',
    name: "Resource",
    accordion: [{
      title: "Journal owner",
      body: [
        "Books, web articles, etc you've found relevant and helpful will train AI to recommend such resources to future users with similar entries."
      ]
    }, {
      title: "Therapists",
      body: [
        "Recommend resources to this client.",
        "Books, web articles, etc you've found relevant and helpful will train AI to recommend such resources to future users with similar entries.",
      ]
    }]
  }]

  const renderSection = (obj) => {
    return <Col>
      <Button
        variant='outline-primary'
        size='sm'
        onClick={() => setAdding(obj.key)}
      >+ {obj.name}</Button>
      <Accordion>
        <CustomToggle eventKey="0">Why add a {obj.key}?</CustomToggle>
        <Accordion.Collapse eventKey="0">
          <>
          {obj.accordion.map((a, i) => <Card key={i} className='bottom-margin'>
            <Card.Body>
              <Card.Title>{a.title}</Card.Title>
              {a.body.map((txt, i) => <>
                <small>{txt}</small>
                {i === a.body.length - 1 ? null : <hr/>}
              </>)}
            </Card.Body>
          </Card>)}
          </>
        </Accordion.Collapse>
      </Accordion>
    </Col>
  }

  const renderSections = () => (
    <Row lg={3} xs={1}>
      {noteTypes.map(renderSection)}
    </Row>
  )

  const clear = () => {
    setText('')
    setPrivate(false)
    setAdding(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    await fetch_(`entries/${entry_id}/notes`, 'POST', {type: adding, text, private: private_})
    await fetchNotes()
    clear()
  }

  const renderForm = () => {
    const textOpts = {
      label: {type: 'text', placeholder: "A word or three to describe what's going on here (codependence, rejection sensitivity dysphoria, trauma, etc)."},
      note: {as: 'textarea', cols: 5, placeholder: "Can be a note-to-self, a communication with the user, or a description of what's going on in this entry."},
      resource: {type: 'text', placeholder: "Enter URL to a resource (a web article, Amazon book link, etc)."}
    }[adding]
    return <Form onSubmit={submit}>
      <Form.Group controlId="formText">
        <Form.Control
          {...textOpts}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </Form.Group>

      <Form.Group controlId="formPrivate">
        <Form.Check
          type="checkbox"
          label="Private"
          checked={private_}
          onChange={(e) => setPrivate(e.target.checked)}
        />
        <Form.Text>This {adding} will be visible only to you.</Form.Text>
      </Form.Group>
      <Button
        variant="primary"
        onClick={submit}
      >Submit</Button>{' '}
      <Button variant='secondary' size="sm" onClick={clear}>
        Cancel
      </Button>
    </Form>
  }

  return <>
    {!!notes.length && <>
      {notes.map(n => <Card className='bottom-margin'>
        <Card.Body>
          <Badge variant="primary">{n.type}</Badge>{' '}
          {n.private ? "[private] " : null}
          {n.text}
        </Card.Body>
      </Card>)}
    </>}
    {adding ? renderForm() : renderSections()}
  </>
}
