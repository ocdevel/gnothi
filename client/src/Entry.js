import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState} from "react"
import {spinner, SimplePopover, fmtDate} from "./utils"
import {
  Button,
  Col,
  Form,
  Modal,
  Row,
  Accordion,
  Card
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import './Entry.css'
import {FaTags, FaPen, FaExpandAlt} from "react-icons/fa"
import Tags from "./Tags"
import moment from 'moment'


export default function Entry({fetch_, as, setServerError, update}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [showPreview, setShowPreview] = useState(false)
  const [onlyPreview, setOnlyPreview] = useState(!!entry_id)
  const [form, setForm] = useState({title: '', text: '', no_ai: false, created_at: null})
  const [entry, setEntry] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState({})
  const [maximize, setMaximize] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const fetchEntry = async () => {
    if (!entry_id) { return }
    const {data} = await fetch_(`entries/${entry_id}`, 'GET')
    const {title, text, no_ai, created_at} = data
    setForm({title, text, no_ai, created_at})
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
    let {title, text, no_ai, created_at} = form
    created_at = created_at ? moment(created_at).toDate() : null
    const body = {title, text, no_ai, created_at, tags}
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
  const changeFormBool = k => e => setForm({...form, [k]: e.target.checked})
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

      {!onlyPreview && <>
        <Form.Group controlId="formShowPreview">
          <Form.Check
            type="checkbox"
            label="Show Preview"
            checked={showPreview}
            onChange={changeShowPreview}
          />
        </Form.Group>
        {advanced ? <div>
          <Form.Group controlId="formNoAI">
            <Form.Check
              type="checkbox"
              label="Exclude from AI"
              checked={form.no_ai}
              onChange={changeFormBool('no_ai')}
            />
            <Form.Text>Use rarely, AI can't help with what it doesn't know. Example uses: technical note to a therapist, song lyrics, etc.</Form.Text>
          </Form.Group>
          <Form.Group controlId="formDate">
            <Form.Label>Date</Form.Label>
            <Form.Control
              size='sm'
              type="text"
              placeholder="YYYY-MM-DD"
              value={form.created_at}
              onChange={changeForm('created_at')}
            />
            <Form.Text>Manually enter this entry's date (otherwise it's set to time of submission).</Form.Text>
          </Form.Group>
        </div> : <div>
          <span className='anchor' onClick={() => setAdvanced(true)}>Advanced</span>
        </div>}
      </>}
      <br/>

      <div>
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
      </div>
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
