import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState} from "react"
import {spinner} from "./utils"
import {
  Accordion,
  Button,
  Card,
  Col,
  Form,
  Row,
  Alert,
  Table
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import ReactStars from "react-stars"
import './Entry.css'


export default function Entry({fetch_}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [showPreview, setShowPreview] = useState(false)
  const [form, setForm] = useState({title: '', text: ''})
  const [entry, setEntry] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchEntry = async () => {
    if (!entry_id) { return }
    const res = await fetch_(`entries/${entry_id}`, 'GET')
    setForm({title: res.title, text: res.text})
    setEntry(res)
  }

  useEffect(() => {
    fetchEntry()
  }, [entry_id])

  const cancel = () => history.push('/j')

  const submit = async e => {
    e.preventDefault()
    setSubmitting(true)
    const body = {title: form.title, text: form.text}
    if (entry_id) {
      await fetch_(`entries/${entry_id}`, 'PUT', body)
    } else {
      await fetch_(`entries`, 'POST', body)
    }
    setSubmitting(false)
    history.push('/j')
  }

  const deleteEntry = async () => {
    if (window.confirm(`Delete "${entry.title}"`)) {
      await fetch_(`entries/${entry_id}`, 'DELETE')
      history.push('/j')
    }
  }

  const changeForm = k => e => setForm({...form, [k]: e.target.value})
  const changeShowPreview = e => setShowPreview(e.target.checked)

  return (
    <Form onSubmit={submit}>
      <Form.Group controlId="formTitle">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={changeForm('title')}
        />
        <Form.Text>
          Leave blank to use a machine-generated title based on your entry.
        </Form.Text>
      </Form.Group>

      <Row>
        <Col>
          <Form.Group controlId="formText">
            <Form.Label>Entry</Form.Label>
            <Form.Control
              as="textarea"
              placeholder="Entry"
              required
              rows={10}
              value={form.text}
              onChange={changeForm('text')}
            />
          </Form.Group>
        </Col>
        {showPreview && (
          <Col className='markdown-render'>
            <ReactMarkdown source={form.text} linkTarget='_blank' />
          </Col>
        )}
      </Row>

      <Form.Group controlId="formShowPreview">
        <Form.Check
          type="checkbox"
          label="Show Preview"
          checked={showPreview}
          onChange={changeShowPreview}
        />
      </Form.Group>

      {submitting ? (
        <>
        {spinner}
        <p className='text-muted'>Generating summaries & sentiment</p>
        </>
      ) : (
        <>
        <Button
          variant="primary"
          type="submit"
        >
          Submit
        </Button>&nbsp;
        <Button variant='secondary' size="sm" onClick={cancel}>
          Cancel
        </Button>&nbsp;
        {entry_id && <>
          <Button variant='danger' size="sm" onClick={deleteEntry}>
            Delete
          </Button>
        </>}
        </>
      )}
    </Form>
  )
}
