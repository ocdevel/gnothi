import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {spinner, SimplePopover, fmtDate} from "../utils"
import {
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Row,
  Col,
  Alert
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import './Entry.css'
import {FaTags, FaPen} from "react-icons/fa"
import Tags from "../Tags"
import MarkdownIt from 'markdown-it'
import MdEditor from 'react-markdown-editor-lite'
import 'react-markdown-editor-lite/lib/index.css'
import {AddNotes} from './Notes'
import _ from 'lodash'

import { useSelector, useDispatch } from 'react-redux'
import { fetch_, setServerError, getEntries } from '../redux/actions'

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

const placeholder = `Write a journal entry, whatever's on your mind. Hard times you're going through, politics, philosophy, the weather. Be verbose, AI works best with long-form content - a paragraph or more is ideal, less might result in poor insights or resource-recommendations. Try to use proper grammar and full words, rather than abbreviations or slang ("therapist" rather than "shrink"). AI is decent at inferring, but the more help you give it the better.
 
Separate multiple concepts by hitting ENTER twice (two new lines). So if you're chatting weather, then want to chat relationships - two ENTERs. See the toolbar at the top for formatting help, this editor uses Markdown. The square icon (right-side toolbar) lets you go into full-screen mode, easier for typing long entries. 

After you have one or two entries, head to the Insights and Resources links at the website top to play with the AI.     
`

function Editor({text, changeText}) {
  const dispatch = useDispatch()

  const onImageUpload = async (file) => {
    const formData = new FormData();
    // formData.append('file', file, file.filename);
    formData.append('file', file);
    const headers = {'Content-Type': 'multipart/form-data'}
    const {data, code} = await dispatch(fetch_('upload-image', 'POST', formData, headers))
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
      placeholder={placeholder}
    />
  )
}

export default function Entry() {
  const {entry_id} = useParams()
  const history = useHistory()
  const [editing, setEditing] = useState(!entry_id)
  const [form, setForm] = useState({title: '', text: '', no_ai: false, created_at: null})
  const [formOrig, setFormOrig] = useState()
  const [entry, setEntry] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [tags, setTags] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [notes, setNotes] = useState([])
  const [cacheEntry, setCacheEntry] = useState()
  const as = useSelector(state => state.as)

  const dispatch = useDispatch()

  const showCacheEntry = !editing && entry_id && cacheEntry
  const draftId = `draft-${entry_id || "new"}`

  const fetchEntry = async () => {
    if (!entry_id) { return loadDraft() }
    const {data} = await dispatch(fetch_(`entries/${entry_id}`, 'GET'))
    if (!data) {return} // I think if they refresh on entry/{id} while snooping?
    const form = _.pick(data, 'title text no_ai created_at'.split(' '))
    setForm(form)
    setFormOrig(form)
    setEntry(data)
    setTags(data.entry_tags)
  }

  const fetchNotes = async () => {
    if (!entry_id) { return }
    const {data} = await dispatch(fetch_(`entries/${entry_id}/notes`, 'GET'))
    setNotes(data)
  }

  useEffect(() => {
    fetchEntry()
    fetchNotes()
  }, [entry_id])

  const loadDraft = () => {
    const draft = localStorage.getItem(draftId)
    if (draft) { setForm(JSON.parse(draft)) }
  }
  const saveDraft = useCallback(
    _.debounce((form) => {
      localStorage.setItem(draftId, JSON.stringify(form))
    }, 500),
    []
  )
  const clearDraft = () => {
    localStorage.removeItem(draftId)
    if (formOrig) {setForm(formOrig)}
  }

  const go = (to='/j') => {
    clearDraft()
    dispatch(getEntries())
    history.push(to)
  }

  const submit = async e => {
    e.preventDefault()
    dispatch(setServerError(false))
    setSubmitting(true)
    let {title, text, no_ai, created_at} = form
    const body = {title, text, no_ai, created_at, tags}
    const res = entry_id ? await dispatch(fetch_(`entries/${entry_id}`, 'PUT', body))
      : await dispatch(fetch_(`entries`, 'POST', body))
    setSubmitting(false)
    if (res.code !== 200) {return}
    setEditing(false)
    go(`/j/entry/${res.data.id}`)
  }

  const deleteEntry = async () => {
    if (window.confirm(`Delete "${entry.title}"`)) {
      await dispatch(fetch_(`entries/${entry_id}`, 'DELETE'))
      go()
    }
  }

  const showAiSees = async () => {
    if (!entry_id) { return }
    if (cacheEntry) {return setCacheEntry(null)}
    const {data} = await dispatch(fetch_(`entries/${entry_id}/cache`, 'GET'))
    setCacheEntry(data)
  }

  const changeTitle = e => setForm({...form, title: e.target.value})
  const changeDate = e => setForm({...form, created_at: e.target.value})
  const changeText = (text) => {
    setForm({...form, text})
    saveDraft(form)
  }
  const changeNoAI = e => setForm({...form, no_ai: e.target.checked})
  const changeEditing = e => {
    e.stopPropagation()
    e.preventDefault()
    if (editing) {
      clearDraft()
    } else {
      loadDraft()
    }
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
      {entry_id && <>
        <Button variant='link' className='text-secondary' size="sm" onClick={changeEditing}>
          Cancel
        </Button>
        <Button variant='link' className='text-danger' size="sm" onClick={deleteEntry}>
          Delete
        </Button>{' '}
      </>}
      <Button
        variant="primary"
        onClick={submit}
      >Submit
      </Button>{' '}
    </>
  }

  const renderForm = () => <>
    <Row>
      <Col>
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
            <Editor text={form.text} changeText={changeText} />
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
        </Form>
      </Col>

      {showCacheEntry && <Col>
        <Alert variant='info'>Paragraphs get split in the following way, and AI considers each paraph independently from the other (as if they're separate entries).</Alert>
        <div>{
          cacheEntry.paras ? cacheEntry.paras.map(p => <><p>{p}</p><hr/></>)
            : <p>Nothing here yet.</p>
        }</div>
        <Alert variant='info'>Keywords generated for use in Themes</Alert>
        <div>{
          cacheEntry.clean ? cacheEntry.clean.map(p => <>
            <p>{_.uniq(p.split(' ')).join(' ')}</p>
            <hr/>
          </>)
            : <p>Nothing here yet.</p>
        }</div>
      </Col>}
    </Row>

    <div>
      {!editing && <div className='float-right'>
        <Button size='sm' variant='outline-dark' onClick={showAiSees}>What AI sees</Button>
      </div>}
      <SimplePopover text='Tags'>
        <FaTags />
      </SimplePopover>
      <span className='tools-divider' />
      <Tags
        selected={tags}
        setSelected={setTags}
        noClick={!editing}
        noEdit={!editing}
        preSelectMain={true}
      />
    </div>
  </>

  const renderNotes = () => {
    if (editing || !entry_id || notes.length === 0) { return }
    return <div style={{marginTop: '1rem'}}>
      {notes.map(n => <Card className='mb-3'>
        <Card.Body>
          <Badge variant="primary">{n.type}</Badge>{' '}
          {n.private ? "[private] " : null}
          {n.text}
        </Card.Body>
      </Card>)}
    </div>
  }

  return <>
    <Modal
      show={true}
      size='xl'
      onHide={go}
      scrollable={true}
      keyboard={false}
      backdrop='static'
    >
      <Modal.Header closeButton>
        <Modal.Title>{fmtDate(entry_id ? form.created_at : Date.now())}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {renderForm()}
        {renderNotes()}
      </Modal.Body>


      <Modal.Footer>
        {!editing && entry_id && <div className='mr-auto'>
          <AddNotes entry_id={entry_id} onSubmit={fetchNotes} />
        </div>}
        {renderButtons()}
      </Modal.Footer>
    </Modal>
  </>
}
