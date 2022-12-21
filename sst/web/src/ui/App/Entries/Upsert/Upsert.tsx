import {useNavigate, useParams, Navigate} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {fmtDate} from "../../../../utils/utils"
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
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Entries} from '@gnothi/schemas'

const placeholder = `Write a journal entry, whatever's on your mind. Hard times you're going through, politics, philosophy, the weather. Be verbose, AI works best with long-form content - a paragraph or more is ideal, less might result in poor insights or resource-recommendations.
 
Separate multiple concepts by hitting ENTER twice (two new lines). So if you're chatting weather, then want to chat relationships - two ENTERs. See the toolbar at the top for formatting help, this editor uses Markdown. The square icon (right-side toolbar) lets you go into full-screen mode, easier for typing long entries. 

After you have one or two entries, head to the Insights and Resources links at the website top to play with the AI.     
`

interface Entry {
  entry?: Entries.entries_list_response
  onClose?: Function
}
export default function Upsert(props: Entry) {
  const entryModal = useStore(s => s.entryModal!)
  const setEntryModal = useStore(s => s.setEntryModal)

  const {mode} = entryModal
  const [isNew, isEdit] = [mode === "new", mode === "edit"]

  const [entry, tags_] = isNew ? [{}, {}] : [
    props.entry!.entry, props.entry!.tags
  ]

  const defaults = isEdit ? {defaultValues: entry} : {}
  const form = useForm({
    resolver: zodResolver(Entries.entries_upsert_request.shape.entry),
    ...defaults
  })
  const navigate = useNavigate()
  const as = useStore(s => s.user.as)
  const send = useStore(s => s.send)
  const [formOrig, setFormOrig] = useState()
  const [tags, setTags] = useState(tags_)
  const [advanced, setAdvanced] = useState(false)
  const entriesUpsert = useStore(s => s.res.entries_upsert_response?.res)
  const entriesDel = useStore(s => s.res.entries_delete_response?.res)
  const clear = useStore(a => a.clearEvents)

  const id = entry?.id
  const draftId = `draft-${id || "new"}`

  if (as) {
    // trying to create an entry while snooping
    return setEntryModal(null)
  }

  useEffect(() => {
    if (isNew) { return loadDraft() }
  }, [isNew])

  useEffect(() => {
    return // fixme
    if (!entry) {return}
    const form_ = _.pick(entry, 'title text created_at'.split(' '))
    form.reset(form_)
    setFormOrig(form_)
    setTags(tags_)
  }, [isEdit])

  useEffect(() => {
    // return () => {
    //   clear(['entries_delete_response', 'entries_post_response', 'entries_put_response'])
    // }
  }, [])

  useEffect(() => {
    if (entriesUpsert?.code !== 200) { return }
    clearDraft()
    clear(["entries_upsert_response"])
    props.onClose?.()
  }, [entriesUpsert])

  useEffect(() => {
    if (entriesDel?.code === 200) {go()}
  }, [entriesDel])

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

  const go = (to='/j/list') => {
    clearDraft()
    props.onClose?.()
    // send('entries_list_request', {})
    navigate(to)
  }

  function submit(entry: Entries.entries_upsert_request) {
    const data = {entry, tags}
    send('entries_upsert_request', data)
  }

  const deleteEntry = async () => {
    if (isNew) {return}
    if (window.confirm(`Delete "${entry.title}"`)) {
      send('entries_delete_request', {id: id})
    }
  }

  function changeText(text: string) {
    saveDraft()
  }

  const cancel: React.EventHandler<any> = e => {
    if (isEdit) {
      clearDraft()
      setEntryModal({mode: "view", entry: props.entry})
    } else {
      // loadDraft()
      setEntryModal(null)
    }
  }

  function renderButtons() {
    if (as) {return null}
    if (entriesUpsert?.submitting) {
      return <CircularProgress />
    }

    return <>
      {id && <>
        <Button color='secondary' sx={{marginRight: 'auto'}} size="small" onClick={deleteEntry}>
          Delete
        </Button>
        <Button size="small" onClick={cancel}>
          Cancel
        </Button>
      </>}
      <Button
        color="primary"
        variant='contained'
        type="submit"
        className="button-entries-upsert"
        onClick={form.handleSubmit(submit)}
      >Submit
      </Button>
    </>
  }

  function renderForm() {
    return <Box>
      <Box>
        <TextField2
          name='title'
          label='Title'
          helperText='Leave blank to use a machine-generated title based on your entry.'
          form={form}
        />

        <Editor
          name='text'
          placeholder={placeholder}
          form={form}
          onChange={changeText}
        />

        {advanced && <div>
          <TextField2
            name='created_at'
            label='Date'
            form={form}
            placeholder="YYYY-MM-DD"
            helperText="Manually enter this entry's date (otherwise it's set to time of submission)."
          />
        </div>}
        <br/>
      </Box>
      <Error
        event={/entries\/entr(ies|y).*/g}
        codeRange={[400,500]}
      />

      <Stack justifyContent='space-between' direction='row' alignItems='center'>
        <Tags
          selected={tags}
          setSelected={setTags}
          noClick={false}
          noEdit={false}
          preSelectMain={true}
        />
      </Stack>
    </Box>
  }

  return <Grid container>
    <Grid item xs={12} lg={id ? 8 : 12}>
      <DialogContent>
        {renderForm()}
      </DialogContent>
      <DialogActions>
        {/*viewing && <Box sx={{marginRight: 'auto'}}>
          <AddNotes id={id} />
        </Box>*/}
        {renderButtons()}
      </DialogActions>
    </Grid>
    {id && <Grid item xs={12} lg={4}>
      <DialogContent>
        <Card>
          <CardHeader title='Notes' />
          <CardContent>
            <NotesList entry_id={id} />
          </CardContent>
        </Card>
      </DialogContent>
    </Grid>}
  </Grid>
}
