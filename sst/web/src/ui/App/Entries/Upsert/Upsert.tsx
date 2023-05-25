import {useNavigate, useParams, Navigate} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {fmtDate} from "../../../../utils/utils"
import {FaPen} from "react-icons/fa"
import Tags from "../../Tags/Tags"
import 'react-markdown-editor-lite/lib/index.css'
import NoteCreate from '../Notes/Create'

import {Entry as NotesList} from '../Notes/List'
import _ from 'lodash'
import {FullScreenDialog} from "../../../Components/Dialog";
import { Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

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
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Entries} from '@gnothi/schemas'
import dayjs from 'dayjs'

const placeholder = `Write a journal entry, whatever's on your mind. Hard times you're going through, politics, philosophy, the weather. Be verbose, AI works best with long-form content - a paragraph or more is ideal, less might result in poor insights or resource-recommendations.
 
Separate multiple concepts by hitting ENTER twice (two new lines). So if you're chatting weather, then want to chat relationships - two ENTERs. See the toolbar at the top for formatting help, this editor uses Markdown. The square icon (right-side toolbar) lets you go into full-screen mode, easier for typing long entries. 

After you have one or two entries, head to the Insights and Resources links at the website top to play with the AI.     
`

interface Upsert {
  entry?: Entries.entries_list_response
  onClose?: Function
  onSubmit?: Function
}
export default function Upsert(props: Upsert) {
  const entryModal = useStore(s => s.entryModal!)
  const setEntryModal = useStore(s => s.setEntryModal)

  const {mode} = entryModal
  const [isNew, isEdit] = [mode === "new", mode === "edit"]

  const [entry, tags_] = isNew ? [{}, {}] : [
    props.entry!, props.entry!.tags
  ]





  const defaults = isEdit ? {defaultValues: entry} : {}
  const form = useForm({
    resolver: zodResolver(Entries.entries_post_request.omit({tags: true})),
    ...defaults
  })



  const navigate = useNavigate()
  const as = useStore(s => s.user.as)
  const send = useStore(s => s.send)
  const [formOrig, setFormOrig] = useState()
  const [tags, setTags] = useState(tags_)
  const [advanced, setAdvanced] = useState(false)
  const entries_upsert_response = useStore(s => s.res.entries_upsert_response?.res)
  const entries_delete_response = useStore(s => s.res.entries_delete_response?.res)
  const clear = useStore(a => a.clearEvents)
  const [changedDate, setChangedDate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    setSubmitting(false)
    if (entries_upsert_response?.code !== 200) { return }
    const response = entries_upsert_response.data[0]
    clearDraft()
    clear(["entries_upsert_response"])
    // props.onClose?.()
    setEntryModal({mode: "view", entry: response})
  }, [entries_upsert_response])

  useEffect(() => {
    setSubmitting(false)
    if (entries_delete_response?.code === 200) {go()}
  }, [entries_delete_response])

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
    clearDraft()
    props.onClose?.()
    // send('entries_list_request', {})
    navigate(to)
  }

  function submit(formData: Entries.entries_post_request) {
    const data = {
      ...formData,
      tags: tags,
    }

    // set created_at to undefined, which the server will (a) use now() as default for new
    // entries; or (b) skip with updates for existing entries
    if (!changedDate && data.created_at) {
      delete data.created_at
    }

    setSubmitting(true)
    if (isNew) {
      send('entries_post_request', data)
    } else {
      send('entries_put_request', {...data, id})
    }
  }

  const deleteEntry = async () => {
    if (isNew) {return}
    const title = entry.title || entry.ai_title || entry.created_at
    if (window.confirm(`Delete entry: ${title}?`)) {
      setSubmitting(true)
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
    if (entries_upsert_response?.submitting) {
      return <CircularProgress />
    }

    return <>
      {id && <>
        <Button
          color='secondary'
          className='btn-delete'
          sx={{marginRight: 'auto'}}
          size="small"
          disabled={submitting}
          onClick={deleteEntry}
        >
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
        className="btn-submit"
        disabled={submitting}
        onClick={form.handleSubmit(submit)}
      >Submit
      </Button>
    </>
  }

  function datePicker() {
    // const [value, setValue] = React.useState<Dayjs>(dayjs(entry.created_at || new Date()));

    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Controller
          control={form.control}
          name="created_at"
          render={ obj => <DatePicker
            label="Date"
            value={obj.field.value}
            inputFormat="YYYY-MM-DD"
            onChange={(newVal) => {
              setChangedDate(true)
              obj.field.onChange(newVal)
            }}
            disableFuture
            renderInput={(params) => <TextField {...params} />}
          />}
        />
      </LocalizationProvider>
    );
  }

  function renderForm() {
    return <Stack className="form-upsert"
      spacing={2}
      direction='column'>

        {datePicker()}
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

        {/*<div>*/}
        {/*  <TextField2*/}
        {/*    name='created_at'*/}
        {/*    label='Date'*/}
        {/*    form={form}*/}
        {/*    placeholder="YYYY-MM-DD"*/}
        {/*    helperText="Manually enter this entry's date (otherwise it's set to time of submission)."*/}
        {/*  />*/}
        {/*</div>*/}
        {/*<br/>*/}

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
          preSelectMain={isNew}
        />
      </Stack>
    </Stack>
  }

  // TODO
  const BEHAVIORS_IMPLEMENTED = false
  function renderBehaviors() {
    // TODO
    return null
  }

  return <Grid container className="upsert">
    <Grid item xs={12} lg={BEHAVIORS_IMPLEMENTED ? (id ? 8 : 12) : 12}>
      <DialogContent>
        {renderForm()}
      </DialogContent>
      <DialogActions>
        {/*viewing && <Box sx={{marginRight: 'auto'}}>
          <NoteCreate id={id} />
        </Box>*/}
        {renderButtons()}
      </DialogActions>
    </Grid>
    {BEHAVIORS_IMPLEMENTED && id && <Grid item xs={12} lg={4}>
      <DialogContent>
        {renderBehaviors()}
      </DialogContent>
    </Grid>}
  </Grid>
}
