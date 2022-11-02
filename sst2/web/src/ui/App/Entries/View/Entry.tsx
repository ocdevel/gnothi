import {useNavigate, useParams, Navigate} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {fmtDate} from "../../../../utils/utils"
import ReactMarkdown from "react-markdown"
import {FaPen} from "react-icons/fa"
import Tags from "../../Tags/Tags"
import 'react-markdown-editor-lite/lib/index.css'
import {AddNotes, NotesList} from '../Notes'
import _ from 'lodash'
import {FullScreenDialog} from "../../../Components/Dialog";

import {useStore} from "../../../../data/store"
import Error from "../../../Components/Error";
import CircularProgress from "@mui/material/CircularProgress"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import {TextField2, Checkbox2} from "../../../Components/Form";
import Editor from "../../../Components/Editor";
import {Alert2} from "../../../Components/Misc";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import CacheEntry from './Cache'
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Entries} from '../../../../data/schemas'

const placeholder = `Write a journal entry, whatever's on your mind. Hard times you're going through, politics, philosophy, the weather. Be verbose, AI works best with long-form content - a paragraph or more is ideal, less might result in poor insights or resource-recommendations. Try to use proper grammar and full words, rather than abbreviations or slang ("therapist" rather than "shrink"). AI is decent at inferring, but the more help you give it the better.
 
Separate multiple concepts by hitting ENTER twice (two new lines). So if you're chatting weather, then want to chat relationships - two ENTERs. See the toolbar at the top for formatting help, this editor uses Markdown. The square icon (right-side toolbar) lets you go into full-screen mode, easier for typing long entries. 

After you have one or two entries, head to the Insights and Resources links at the website top to play with the AI.     
`

interface Entry {
  entry?: Entries.Entry
  close?: any
}
export default function Entry({entry, close}: Entry) {
  const form = useForm({
    resolver: zodResolver(Entries.entries_post_request),
    defaultValues: entry,
  });
  const navigate = useNavigate()
  const as = useStore(state => state.as)
  const send = useStore(s => s.send)
  const [editing, setEditing] = useState(!entry)
  const [formOrig, setFormOrig] = useState()
  const [tags, setTags] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [aiSees, setAiSees] = useState(false)
  const entryPost = useStore(s => s.res.entries_post_response?.res)
  const entryPut = useStore(s => s.res.entries_put_response?.res)
  const entryDel = useStore(s => s.res.entries_delete_response?.res)
  const clear = useStore(a => a.clearEvents)

  const eid = entry?.id
  const viewing = !editing && eid
  const draftId = `draft-${eid || "new"}`

  if (eid && as) {
    // trying to create an entry while snooping
    return <Navigate to='/j' replace={true} />
  }

  useEffect(() => {
    if (!eid) { return loadDraft() }
  }, [eid])

  useEffect(() => {
    return // FIXME!! maximum callstack exceeded
    if (!entry) {return}
    const form_ = _.pick(entry, 'title text no_ai created_at'.split(' '))
    form.reset(form)
    setFormOrig(form_)
    setTags(entry.entry_tags)
  }, [entry])

  useEffect(() => {
    return () => {
      clear(['entries_delete_response', 'entries_post_response', 'entries_put_response'])
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
    send('entries_get_response', {})
    navigate(to)
  }

  function submit(data) {
    const body = {...data, tags}
    if (eid) {
      send('entries_put_request', {...body, id: eid})
    } else {
      send('entries_post_request', body)
    }
  }

  const deleteEntry = async () => {
    if (window.confirm(`Delete "${entry.title}"`)) {
      send('entries_delete_request', {id: eid})
    }
  }

  const showAiSees = async () => {
    if (!eid) { return }
    setAiSees(!aiSees)
    send('entries_cache_get_request', {id: eid})
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
    if (!editing) return <Stack spacing={2} direction='row'>
      <Button
        size='small'
        color='primary'
        onClick={showAiSees}
      >What AI sees</Button>
      <Button
        variant='outlined'
        color='primary'
        onClick={changeEditing}
        startIcon={<FaPen />}
      >Edit
      </Button>
    </Stack>

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
        onClick={form.handleSubmit(submit)}
      >Submit
      </Button>
    </>
  }

  const renderForm = () => <>
    <form onSubmit={form.handleSubmit(submit)}>
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
      event={/entries\/entr(ies|y).*/g}
      codeRange={[400,500]}
    />
    {viewing && aiSees && <div>
      <CacheEntry />
    </div>}

    <Box display='flex' justifyContent='space-between' direction='row' alignItems='center'>
      <Tags
        selected={tags}
        setSelected={setTags}
        noClick={!editing}
        noEdit={!editing}
        preSelectMain={true}
      />
    </Box>
  </>

  function renderEditing() {
    return <>
      <DialogContent>{renderForm()}</DialogContent>
      <DialogActions>{renderButtons()}</DialogActions>
    </>
  }

  function renderViewing() {
    return <Grid container>
      <Grid item xs={12} lg={8}>
        <DialogContent>
            {renderForm()}
        </DialogContent>
        <DialogActions>
          {/*viewing && <Box sx={{marginRight: 'auto'}}>
            <AddNotes eid={eid} />
          </Box>*/}
          {renderButtons()}
        </DialogActions>
      </Grid>
      <Grid item xs={12} lg={4}>
        <DialogContent>
          <Card>
            <CardHeader title='Notes' />
            <CardContent>
              <NotesList entry_id={eid} />
            </CardContent>
          </Card>
        </DialogContent>
      </Grid>
    </Grid>
  }

  return <>
    <FullScreenDialog
      open={true}
      onClose={() => go()}
      title={fmtDate(eid ? entry.created_at : Date.now())}
    >
      {editing ? renderEditing() : renderViewing()}
    </FullScreenDialog>
  </>
}
