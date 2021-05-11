import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {fmtDate} from "../Helpers/utils"
import ReactMarkdown from "react-markdown"
import './Entry.css'
import {FaPen} from "react-icons/fa"
import Tags from "../Tags"
import 'react-markdown-editor-lite/lib/index.css'
import {AddNotes, NotesList} from './Notes'
import _ from 'lodash'
import {FullScreenDialog} from "../Helpers/Dialog";

import {useStoreActions, useStoreState} from "easy-peasy";
import Error from "../Error";
import CircularProgress from "@material-ui/core/CircularProgress"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import Grid from "@material-ui/core/Grid"
import Button from "@material-ui/core/Button"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import {yup, makeForm, TextField2, Checkbox2} from "../Helpers/Form";
import Editor from "../Helpers/Editor";
import {Alert2} from "../Helpers/Misc";

const schema = yup.object().shape({
  title: yup.string().nullable(),
  text: yup.string().min(1),
  no_ai: yup.boolean(),
  created_at: yup.string().nullable(),
})
const defaults = {title: '', text: '', no_ai: false, created_at: null}
const useForm = makeForm(schema, defaults)

const placeholder = `Write a journal entry, whatever's on your mind. Hard times you're going through, politics, philosophy, the weather. Be verbose, AI works best with long-form content - a paragraph or more is ideal, less might result in poor insights or resource-recommendations. Try to use proper grammar and full words, rather than abbreviations or slang ("therapist" rather than "shrink"). AI is decent at inferring, but the more help you give it the better.
 
Separate multiple concepts by hitting ENTER twice (two new lines). So if you're chatting weather, then want to chat relationships - two ENTERs. See the toolbar at the top for formatting help, this editor uses Markdown. The square icon (right-side toolbar) lets you go into full-screen mode, easier for typing long entries. 

After you have one or two entries, head to the Insights and Resources links at the website top to play with the AI.     
`

export function Entry({entry=null, close=null}) {
  const history = useHistory()
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(a => a.ws.emit)
  const [editing, setEditing] = useState(!entry)
  const form = useForm()
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
    const form_ = _.pick(entry, 'title text no_ai created_at'.split(' '))
    form.reset(form)
    setFormOrig(form_)
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
    if (draft) { form.reset(JSON.parse(draft)) }
  }
  const saveDraft = useCallback(
    _.debounce(() => {
      localStorage.setItem(draftId, JSON.stringify(form.getValues()))
    }, 500),
    []
  )
  const clearDraft = () => {
    console.log('clearDraft')
    localStorage.removeItem(draftId)
    if (formOrig) {form.reset(formOrig)}
  }

  const go = (to='/j') => {
    if (close) {return close()}
    clearDraft()
    emit(['entries/entries/get', {}])
    history.push(to)
  }

  function submit(data) {
    const body = {...data, tags}
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

  function changeText(text) {
    saveDraft()
  }

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
      return <CircularProgress />
    }
    if (!editing) return <>
      <Button
        variant='outlined'
        color='primary'
        onClick={changeEditing}
        startIcon={<FaPen />}
      >Edit
      </Button>
    </>

    return <>
      {eid && <>
        <Button color='secondary' sx={{marginRight: 'auto'}} size="small" onClick={deleteEntry}>
          Delete
        </Button>
        <Button variant={false} size="small" onClick={changeEditing}>
          Cancel
        </Button>
      </>}
      <Button
        color="primary"
        variant='contained'
        onClick={submit}
      >Submit
      </Button>
    </>
  }

  const renderForm = () => <>
    <Grid container>
      <Grid item xs>
        <form onSubmit={submit}>
          {editing ? <>
            <TextField2
              name='title'
              label='Title'
              helperText='Leave blank to use a machine-generated title based on your entry.'
              form={form}
            />
          </> : <>
            <Typography variant='h2'>{entry.title}</Typography>
          </>}

          {editing ? <Editor
            name='text'
            placeholder={placeholder}
            form={form}
            onChange={changeText}
          /> : <ReactMarkdown
            source={entry.text}
            linkTarget='_blank'
          />}

          {editing && <>
            {advanced ? <div>
              <Checkbox2
                name='no_ai'
                label="Exclude from AI"
                helperText="Use rarely, AI can't help with what it doesn't know. Example uses: technical note to a therapist, song lyrics, etc."
                form={form}
              />
              <TextField2
                name='created_at'
                label='Date'
                form={form}
                placeholder="YYYY-MM-DD"
                helperText="Manually enter this entry's date (otherwise it's set to time of submission)."
              />
            </div> : <div>
              <span className='anchor' onClick={() => setAdvanced(true)}>Advanced</span>
            </div>}
          </>}
          <br/>
        </form>
        <Error
          action={/entries\/entr(ies|y).*/g}
          codeRange={[400,500]}
        />
      </Grid>

      {showCacheEntry && <Grid item xs>
        <Alert2 severity='info'>
          Paragraphs get split in the following way, and AI considers each paraph independently from the other (as if they're separate entries).
        </Alert2>
        <div>{
          cacheEntry.paras ? cacheEntry.paras.map((p, i) => <div key={i}>
              <p>{p}</p><hr/>
            </div>)
            : <p>Nothing here yet.</p>
        }</div>
        <Alert2 severity='info'>Keywords generated for use in Themes</Alert2>
        <div>{
          cacheEntry.clean ? cacheEntry.clean.map((p, i) => <div key={i}>
            <p>{_.uniq(p.split(' ')).join(' ')}</p>
            <hr/>
          </div>)
            : <p>Nothing here yet.</p>
        }</div>
      </Grid>}
    </Grid>

    <Box display='flex' justifyContent='space-between' direction='row' alignItems='center'>
      <Tags
        selected={tags}
        setSelected={setTags}
        noClick={!editing}
        noEdit={!editing}
        preSelectMain={true}
      />
      {!editing && <Button
        sx={{minWidth: 100}}
        size='small'
        color='primary'
        onClick={showAiSees}
      >What AI sees</Button>
      }
    </Box>
  </>

  return <>
    <FullScreenDialog
      open={true}
      onClose={() => go()}
      title={fmtDate(eid ? entry.created_at : Date.now())}
    >
      <DialogContent>
        {renderForm()}
        {!editing && eid && <NotesList eid={eid} />}
      </DialogContent>
      <DialogActions>
        {!editing && eid && <Box sx={{marginRight: 'auto'}}>
          <AddNotes eid={eid} />
        </Box>}
        {renderButtons()}
      </DialogActions>
    </FullScreenDialog>
  </>
}

export function EntryPage() {
  const {entry_id} = useParams()
  const entry = useStoreState(s => s.ws.data['entries/entries/get']?.obj?.[entry_id])
  return <Entry entry={entry} />
}
