import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {spinner, SimplePopover, fmtDate} from "../Helpers/utils"
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
import {FaTags, FaPen, FaRegComments} from "react-icons/fa"
import Tags from "../Tags"
import MarkdownIt from 'markdown-it'
import MdEditor from 'react-markdown-editor-lite'
import 'react-markdown-editor-lite/lib/index.css'
import {AddNotes, NotesNotifs, NotesList} from './Notes'
import _ from 'lodash'
import {EE} from '../redux/ws'
import {FullScreenDialog} from "../Helpers/Dialog";

import {useStoreActions, useStoreState} from "easy-peasy";
import Error from "../Error";

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
  const fetch = useStoreActions(actions => actions.server.fetch)
  const onImageUpload = async (file) => {
    const formData = new FormData();
    // formData.append('file', file, file.filename);
    formData.append('file', file);
    const headers = {'Content-Type': 'multipart/form-data'}
    const {data, code} = await fetch({route: 'upload-image', method: 'POST', body: formData, headers})
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

export function Entry({entry=null, close=null}) {
  const history = useHistory()
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(a => a.ws.emit)
  const [editing, setEditing] = useState(!entry)
  const [form, setForm] = useState({title: '', text: '', no_ai: false, created_at: null})
  const [formOrig, setFormOrig] = useState()
  const [tags, setTags] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [cacheEntry, setCacheEntry] = useState()
  const entryPost = useStoreState(s => s.ws.res['entries/entries/post'])
  const entryPut = useStoreState(s => s.ws.res['entries/entry/put'])
  const entryDel = useStoreState(s => s.ws.res['entries/entry/delete'])
  const cache = useStoreState(s => s.ws.data['entries/entry/cache/get'])
  const clear = useStoreActions(a => a.ws.clear)

  const eid = entry?.id
  const showCacheEntry = !editing && eid && cacheEntry
  const draftId = `draft-${eid || "new"}`

  useEffect(() => {
    if (!eid) { return loadDraft() }
  }, [eid])

  useEffect(() => {
    if (!entry) {return}
    const form = _.pick(entry, 'title text no_ai created_at'.split(' '))
    setForm(form)
    setFormOrig(form)
    setTags(entry.entry_tags)
  }, [entry])

  useEffect(() => {
    setCacheEntry(cache)
  }, [cache])

  useEffect(() => {
    return () => {
      clear(['entries/entry/delete', 'entries/entries/post', 'entries/entry/put'])
    }
  }, [])

  useEffect(() => {
    if (entryPost?.code === 200 && entryPost?.id) {
      setEditing(false)
      go(`/j/entry/${entryPost.id}`)
    }
  }, [entryPost])

  useEffect(() => {
    if (entryPut?.code === 200) {setEditing(false)}
  }, [entryPut])

  useEffect(() => {
    if (entryDel?.code === 200) {go()}
  }, [entryDel])

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
    console.log('clearDraft')
    localStorage.removeItem(draftId)
    if (formOrig) {setForm(formOrig)}
  }

  const go = (to='/j') => {
    if (close) {return close()}
    clearDraft()
    emit(['entries/entries/get', {}])
    history.push(to)
  }

  const submit = async e => {
    e.preventDefault()
    let {title, text, no_ai, created_at} = form
    const body = {title, text, no_ai, created_at, tags}
    if (eid) {
      emit(['entries/entry/put', {...body, id: eid}])
    } else {
      emit(['entries/entries/post', body])
    }
  }

  const deleteEntry = async () => {
    if (window.confirm(`Delete "${entry.title}"`)) {
      emit(['entries/entry/delete', {id: eid}])
    }
  }

  const showAiSees = async () => {
    if (!eid) { return }
    if (cacheEntry) {return setCacheEntry(null)}
    emit(['entries/entry/cache/get', {id: eid}])
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
    if (as) {return null}
    if (entryPost?.submitting || entryPut?.submitting) {
      return spinner
    }
    if (!editing) return <>
      <Button
        variant='outline-primary'
        onClick={changeEditing}
      ><FaPen /> Edit
      </Button>
    </>

    return <>
      {eid && <>
        <Button variant='link' className='text-danger mr-auto' size="sm" onClick={deleteEntry}>
          Delete
        </Button>
        <Button variant='link' className='text-secondary' size="sm" onClick={changeEditing}>
          Cancel
        </Button>
      </>}
      <Button
        variant="primary"
        onClick={submit}
      >Submit
      </Button>
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
        <Error
          action={/entries\/entr(ies|y).*/g}
          codeRange={[400,500]}
        />
      </Col>

      {showCacheEntry && <Col>
        <Alert variant='info'>Paragraphs get split in the following way, and AI considers each paraph independently from the other (as if they're separate entries).</Alert>
        <div>{
          cacheEntry.paras ? cacheEntry.paras.map((p, i) => <div key={i}>
              <p>{p}</p><hr/>
            </div>)
            : <p>Nothing here yet.</p>
        }</div>
        <Alert variant='info'>Keywords generated for use in Themes</Alert>
        <div>{
          cacheEntry.clean ? cacheEntry.clean.map((p, i) => <div key={i}>
            <p>{_.uniq(p.split(' ')).join(' ')}</p>
            <hr/>
          </div>)
            : <p>Nothing here yet.</p>
        }</div>
      </Col>}
    </Row>

    <div>
      {!editing && <div className='float-right'>
        <Button size='sm' variant='link' onClick={showAiSees}>What AI sees</Button>
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

  return <>
    <FullScreenDialog
      open={true}
      handleClose={() => go()}
      title={fmtDate(eid ? form.created_at : Date.now())}
    >
      {renderForm()}
      {!editing && eid && <NotesList eid={eid} />}
      <Modal.Footer>
        {!editing && eid && <div className='mr-auto'>
          <AddNotes eid={eid} />
        </div>}
        {renderButtons()}
      </Modal.Footer>
    </FullScreenDialog>
  </>
}

export function EntryPage() {
  const {entry_id} = useParams()
  const entry = useStoreState(s => s.ws.data['entries/entries/get']?.obj?.[entry_id])
  return <Entry entry={entry} />
}
