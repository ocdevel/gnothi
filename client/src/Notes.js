import {
  Badge,
  Button,
  Col,
  Form,
  Row,
  Modal,
  Tabs,
  Tab
} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {FaQuestionCircle} from "react-icons/all";
import {SimplePopover} from "./utils";

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

const noteTypes = [{
  key: 'label',
  name: "Label",
  user: [
    "CBT & Zen promote labeling your thoughts as an objective observer, called \"thought diffusion\". It gets you outside your emotions to analyze them, which has positive cognitive impact.",
    "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
    "Might help therapists assess your entries."
  ],
  therapist: [
    "Can serve as mini note-taking on entries.",
    "Helps AI recommend resources to this client."
  ]
}, {
  key: 'note',
  name: "Note",
  user: [
    "CBT & Zen promote labeling your thoughts as an objective observer, called \"thought diffusion\". It gets you outside your emotions to analyze them, which has positive cognitive impact. The more dispassionate details, the better the effect.",
    "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
    "Might help therapists assess your entries.",
  ],
  therapist: [
    "For private notes, consider this an organized note-taking feature for your clients. Private notes will also appear in the sidebar, so you can recall your notes before your session.",
    "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
    "Non-private notes can serve as communication with the client: advice, support, or helping them understand their entries from your perspective.",
  ]
}, {
  key: 'resource',
  name: "Resource",
  user: [
    "Books, web articles, etc you've found relevant and helpful will train AI to recommend such resources to future users with similar entries."
  ],
  therapist: [
    "Recommend resources to this client.",
    "Books, web articles, etc you've found relevant and helpful will train AI to recommend such resources to future users with similar entries.",
  ]
}]

export function AddNotes({fetch_, as, entry_id, onSubmit}) {
  const [adding, setAdding] = useState(null)
  const [text, setText] = useState('')
  const [private_, setPrivate] = useState(false)
  const [showHelp, setShowHelp] = useState(false)


  const renderHelpModal = () => {
    return <>
      <Modal show={true} size='lg' onHide={() => setShowHelp(false)} scrollable={true}>
        <Modal.Header closeButton >
          <Modal.Title>Why label entries?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            variant="pills"
            defaultActiveKey={as ? "therapist" : "user"}
          >
            {['user', 'therapist'].map(k => (
              <Tab
                key={k}
                eventKey={k}
                title={k === 'user' ? "As Journal Owner" : "As Therapist/Friend"}
              >
                <Row lg={3} xs={1} style={{marginTop: '1rem'}}>
                  {noteTypes.map(obj => <Col>
                    <h5>{obj.name}s</h5>
                    {obj[k].map((txt, i) => <div key={k + i}>
                      {txt}
                      {i === obj[k].length - 1 ? null : <hr/>}
                    </div>)}
                  </Col>)}
                </Row>
              </Tab>
            ))}
          </Tabs>
        </Modal.Body>
      </Modal>
    </>
  }

  const renderSection = (obj) => {
    return (
      <Button
        style={{marginRight: '.5rem'}}
        variant='outline-primary'
        size='sm'
        onClick={() => setAdding(obj.key)}
      >+ {obj.name}</Button>
    )
  }

  const renderButtons = () => <>
    {noteTypes.map(renderSection)}{' '}
    <SimplePopover text="What are these?">
      <span
        className='cursor-pointer'
        onClick={() => setShowHelp(true)}
      >
        <FaQuestionCircle />
      </span>
    </SimplePopover>
  </>

  const clear = () => {
    setText('')
    setPrivate(false)
    setAdding(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    await fetch_(`entries/${entry_id}/notes`, 'POST', {type: adding, text, private: private_})
    clear()
    onSubmit()
  }

  const renderForm = () => {
    const textOpts = {
      label: {type: 'text'},
      note: {as: 'textarea', cols: 5},
      resource: {type: 'text'}
    }[adding]
    const help = {
      label: "A word or three to describe what's going on here (codependence, rejection sensitivity dysphoria, trauma, etc).",
      note: "Can be a note-to-self, a communication with the user, or a description of what's going on in this entry.",
      resource: "Enter URL to a resource (a web article, Amazon book link, etc)."
    }[adding]
    return <>
      <Modal show={true} size='lg' onHide={clear} scrollable={true}>
        <Modal.Header closeButton>
          <Modal.Title>Add a {adding}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submit}>
            <Form.Group controlId="formText">
              <Form.Control
                {...textOpts}
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <Form.Text>{help}</Form.Text>
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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={submit}
          >Submit</Button>{' '}
          <Button variant='secondary' onClick={clear}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  }

  return <>
    {showHelp && renderHelpModal()}
    {adding ? renderForm() : renderButtons()}
  </>
}
