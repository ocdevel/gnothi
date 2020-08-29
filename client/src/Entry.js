import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext} from "react"
import {spinner, SimplePopover, fmtDate} from "./utils"
import {
  Button,
  Form,
  Modal,
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import './Entry.css'
import {FaTags, FaPen} from "react-icons/fa"
import Tags from "./Tags"
import MarkdownIt from 'markdown-it'
import MdEditor from 'react-markdown-editor-lite'
import 'react-markdown-editor-lite/lib/index.css'
import {Notes} from './Notes'

const mdParser = new MarkdownIt(/* Markdown-it options */);

// https://github.com/HarryChen0506/react-markdown-editor-lite/blob/master/docs/plugin.md
const plugins = [
  'header',
  'font-bold',
  'font-italic',
  'font-underline',
  'font-strikethrough',
  'list-unordered',
  'list-ordered',
  'block-quote',
  'image',
  'link',
  'mode-toggle',
  'full-screen',
  // f3b13052: auto-resize
]

function Editor({fetch_, text, changeText}) {
  const onImageUpload = async (file) => {
    const formData = new FormData();
    // formData.append('file', file, file.filename);
    formData.append('file', file);
    const headers = {'Content-Type': 'multipart/form-data'}
    const {data, code} = await fetch_('upload-image', 'POST', formData, headers)
    return data.filename
  }

  function onChange({html, text}) {
    changeText(text)
  }

  return (
    <MdEditor
      plugins={plugins}
      value={text}
      style={{ height: 300, width: '100%' }}
      config={{view: { menu: true, md: true, html: false }}}
      renderHTML={(text) => mdParser.render(text)}
      onChange={onChange}
      onImageUpload={onImageUpload}
    />
  )
}

export default function Entry({fetch_, as, setServerError, update}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [editing, setEditing] = useState(!entry_id)
  const [form, setForm] = useState({title: '', text: '', no_ai: false, created_at: null})
  const [entry, setEntry] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState({})
  const [advanced, setAdvanced] = useState(false)

  const fetchEntry = async () => {
    if (!entry_id) { return }
    const {data} = await fetch_(`entries/${entry_id}`, 'GET')
    if (!data) {return} // I think if they refresh on entry/{id} while snooping?
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
    const body = {title, text, no_ai, created_at, tags}
    const res = entry_id ? await fetch_(`entries/${entry_id}`, 'PUT', body)
      : await fetch_(`entries`, 'POST', body)
    setSubmitting(false)
    if (res.code !== 200) {return}
    setEditing(false)
    history.push(`/j/entry/${res.data.id}`)
    update()
  }

  const deleteEntry = async () => {
    if (window.confirm(`Delete "${entry.title}"`)) {
      await fetch_(`entries/${entry_id}`, 'DELETE')
      goBack()
    }
  }

  const changeTitle = e => setForm({...form, title: e.target.value})
  const changeDate = e => setForm({...form, created_at: e.target.value})
  const changeText = (text) => setForm({...form, text})
  const changeNoAI = e => setForm({...form, no_ai: e.target.checked})
  const changeEditing = e => {
    e.stopPropagation()
    e.preventDefault()
    setEditing(!editing)
  }

  const renderButtons = () => {
    if (as) return null
    if (submitting) return spinner
    if (!editing) return <>
      <Button
        variant='outline-primary'
        onClick={changeEditing}
      ><FaPen /> Edit
      </Button>
    </>
    return <>
      <Button
        variant="primary"
        onClick={submit}
      >Submit
      </Button>{' '}
      {entry_id && <>
        <Button variant='danger' size="sm" onClick={deleteEntry}>
          Delete
        </Button>{' '}
        <Button variant='secondary' size="sm" onClick={changeEditing}>
          Cancel
        </Button>
      </>}
    </>
  }

  const renderForm = () => <>
    <Form onSubmit={submit}>
      {editing ? <>
        <Form.Group controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={changeTitle}
          />
          <Form.Text>
            Leave blank to use a machine-generated title based on your entry.
          </Form.Text>
        </Form.Group>
      </> : <>
        <h2>{form.title}</h2>
      </>}

      {editing ? (
        <Editor fetch_={fetch_} text={form.text} changeText={changeText} />
      ) : (
        <ReactMarkdown source={form.text} linkTarget='_blank' />
      )}

      {editing && <>
        {advanced ? <div>
          <Form.Group controlId="formNoAI">
            <Form.Check
              type="checkbox"
              label="Exclude from AI"
              checked={form.no_ai}
              onChange={changeNoAI}
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
              onChange={changeDate}
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
          noClick={!editing}
          noEdit={!editing}
          preSelectMain={true}
        />
      </div>
    </Form>
  </>

  return <>
    <Modal
      show={true}
      size='xl'
      onHide={goBack}
      scrollable={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>{fmtDate(entry_id ? form.created_at : Date.now())}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {renderForm()}
        {!editing && entry_id && <>
          <hr/>
          <Notes fetch_={fetch_} entry_id={entry_id} as={as} />
        </>}
      </Modal.Body>


      <Modal.Footer>
        {renderButtons()}
      </Modal.Footer>
    </Modal>
  </>
}
