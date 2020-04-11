import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState} from "react"
import {fetch_, spinner} from "./utils"
import _ from "lodash"
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


export default function Entry({jwt}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [showPreview, setShowPreview] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [text, setText] = useState('')

  const fetchEntry = async () => {
    if (!entry_id) { return }
    const res = await fetch_(`entries/${entry_id}`, 'GET', null, jwt)
    setTitle(res.title)
    setText(res.text)
  }

  useEffect(() => {
    fetchEntry()
  }, [entry_id])

  const cancel = () => history.push('/j')

  const submit = async e => {
    e.preventDefault()
    setSubmitting(true)
    const body = {title, text}
    if (entry_id) {
      await fetch_(`entries/${entry_id}`, 'PUT', body, jwt)
    } else {
      await fetch_(`entries`, 'POST', body, jwt)
    }
    setSubmitting(false)
    history.push('/j')
  }

  const changeTitle = e => setTitle(e.target.value)
  const changeText = e => setText(e.target.value)
  const changeShowPreview = e => setShowPreview(e.target.checked)

  return (
    <Form onSubmit={submit}>
      <Form.Group controlId="formTitle">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Title"
          value={title}
          onChange={changeTitle}
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
              value={text}
              onChange={changeText}
            />
          </Form.Group>
        </Col>
        {showPreview && (
          <Col className='markdown-render'>
            <ReactMarkdown source={text} linkTarget='_blank' />
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
        </Button>
        </>
      )}
    </Form>
  )
}
