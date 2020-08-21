import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState} from "react"
import {spinner, SimplePopover, fmtDate} from "./utils"
import {
  Button,
  Col,
  Form, Modal,
  Row,
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import './Entry.css'
import {FaTags, FaPen, FaExpandAlt} from "react-icons/fa"
import Tags from "./Tags"


export default function Entry({fetch_, as, setServerError, update}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [showPreview, setShowPreview] = useState(false)
  const [onlyPreview, setOnlyPreview] = useState(!!entry_id)
  const [form, setForm] = useState({title: '', text: ''})
  const [entry, setEntry] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState({})
  const [maximize, setMaximize] = useState(false)

  const fetchEntry = async () => {
    if (!entry_id) { return }
    const {data} = await fetch_(`entries/${entry_id}`, 'GET')
    setForm({title: data.title, text: data.text})
    setEntry(data)
    setTags(data.entry_tags)
  }

  useEffect(() => {
    fetchEntry()
  }, [entry_id])

  const goBack = () => {
    update()
    history.push('/j')
  }

  const submit = async e => {
    e.preventDefault()
    setServerError(false)
    setSubmitting(true)
    const body = {
      title: form.title,
      text: form.text,
      tags
    }
    const res = entry_id ? await fetch_(`entries/${entry_id}`, 'PUT', body)
      : await fetch_(`entries`, 'POST', body)
    setSubmitting(false)
    if (res.code !== 200) {return}
    goBack()
  }

  const deleteEntry = async () => {
    if (window.confirm(`Delete "${entry.title}"`)) {
      await fetch_(`entries/${entry_id}`, 'DELETE')
      goBack()
    }
  }

  const changeForm = k => e => setForm({...form, [k]: e.target.value})
  const changeShowPreview = e => setShowPreview(e.target.checked)
  const changeOnlyPreview = e => {
    e.stopPropagation()
    e.preventDefault()
    setOnlyPreview(!onlyPreview)
  }

  const renderButtons = () => <>
    {submitting ? spinner : <>
      {!as && <>
        {onlyPreview ? <>
          <Button
            variant='outline-primary'
            onClick={changeOnlyPreview}
          >
            <FaPen /> Edit
          </Button>
        </> : <>
          <Button
            variant="primary"
            onClick={submit}
          >
            Submit
          </Button>
        </>}{' '}
      </>}
      <Button variant='secondary' size="sm" onClick={goBack}>
        Cancel
      </Button>{' '}
      {!as && entry_id && <>
        <Button variant='danger' size="sm" onClick={deleteEntry}>
          Delete
        </Button>
      </>}
    </>}
  </>

  const renderForm = () => <>
    <Form onSubmit={submit}>
      {onlyPreview ? <>
        <h2>{form.title}</h2>
      </> : <>
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
      </>}

      <Row>
        {!onlyPreview && <Col>
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
        </Col>}
        {(showPreview || onlyPreview) && (
          <Col className='markdown-render'>
            <ReactMarkdown source={form.text} linkTarget='_blank' />
          </Col>
        )}
      </Row>

      {!onlyPreview && <Form.Group controlId="formShowPreview">
        <Form.Check
          type="checkbox"
          label="Show Preview"
          checked={showPreview}
          onChange={changeShowPreview}
        />
      </Form.Group>}

      <SimplePopover text='Tags'>
        <FaTags />
      </SimplePopover>
      <span className='tools-divider' />
      <Tags
        fetch_={fetch_}
        as={as}
        selected={tags}
        setSelected={setTags}
        noClick={onlyPreview}
        noEdit={onlyPreview}
        preSelectMain={true}
      />
    </Form>
  </>

  return <>
    <Modal
      show={true}
      size='lg'
      onHide={goBack}
      scrollable={true}
      dialogClassName={maximize && 'full-width-modal'}
    >
      <Modal.Header>
        <Modal.Title>{fmtDate(entry_id ? form.created_at : Date.now())}</Modal.Title>
        <FaExpandAlt
          style={{top:5,right:0}}
          className='cursor-pointer'
          onClick={() => setMaximize(!maximize)}
        />
      </Modal.Header>

      <Modal.Body>
        {renderForm()}
      </Modal.Body>

      <Modal.Footer>
        {renderButtons()}
      </Modal.Footer>
    </Modal>
  </>
}
