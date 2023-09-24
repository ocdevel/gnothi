import {useNavigate, useParams, Navigate} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback, useMemo} from "react"
import {fmtDate} from "../../../../utils/utils"
import {FaPen} from "react-icons/fa"
import Tags from "../../Tags/Tags"
import 'react-markdown-editor-lite/lib/index.css'
import NoteCreate from '../Notes/Create'

import {Entry as NotesList} from '../Notes/List'
import _ from 'lodash'
import {FullScreenDialog} from "../../../Components/Dialog";
import TextField from '@mui/material/TextField';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';

import {useStore} from "../../../../data/store"
import Error from "../../../Components/Error";
import Button, {ButtonProps} from "@mui/material/Button"
import {TextField2, Checkbox2} from "../../../Components/Form";
import Editor from "../../../Components/Editor";
import {Alert2} from "../../../Components/Misc";

import Stack from "@mui/material/Stack";
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Entries} from '@gnothi/schemas'
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import dayjs from 'dayjs'
import ReactMarkdown from "react-markdown";
import SuggestEntry from './SuggestEntry.tsx'
import Typography from "@mui/material/Typography";
import {shallow} from "zustand/shallow";
import BtnTryGenerative from '../../../Components/BtnTryGenerative'

const placeholder = `Welcome to your journal! This is the perfect place to reflect, express yourself, and capture your thoughts. Take a moment to think about your day, your experiences, or anything that's been on your mind. Use this space to write freely and let your thoughts flow. 

Enjoy the process and happy journaling!     
`

// Be verbose. AI works best with long-form content, so a paragraph or more is ideal for enhanced insights, like themes, book recommendations, summaries, and more.


interface Upsert {
  entry?: Entries.entries_list_response
  onClose?: Function
  onSubmit?: Function
}

export default function Upsert(props: Upsert) {
  const entryModal = useStore(s => s.modals.entry!)
  const setEntryModal = useStore(s => s.modals.setEntry)
  const [creditActivate] = useStore(s => [s.creditActivate], shallow)

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
  const me = useStore(s => s.user?.me)
  const creditActive = useStore(s => s.creditActive)
  const as = useStore(s => s.user.as)
  const send = useStore(s => s.send)
  const [formOrig, setFormOrig] = useState()
  const [tags, setTags] = useState(tags_)
  const [advanced, setAdvanced] = useState(false)
  const entries_upsert_response = useStore(s => s.res.entries_upsert_response?.res)
  const entries_delete_response = useStore(s => s.res.entries_delete_response?.res)
  const clear = useStore(a => a.clearEvents)
  const [changedDate, setChangedDate] = useState(false)
  const submitting = useStore(s => Boolean(s.req.entries_post_request || s.req.entries_put_request || s.req.entries_delete_request))

  const id = entry?.id
  const draftId = `draft-${id || "new"}`

  if (as) {
    // trying to create an entry while snooping
    return setEntryModal(null)
  }

  useEffect(() => {
    if (isNew) {
      return loadDraft()
    }
  }, [isNew])

  useEffect(() => {
    return // fixme
    if (!entry) {
      return
    }
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
    if (entries_upsert_response?.code !== 200) {
      return
    }
    const response = entries_upsert_response.data[0]
    clearDraft()
    clear(["entries_upsert_response"])
    // props.onClose?.()
    setEntryModal({mode: "view", entry: response})
  }, [entries_upsert_response])

  useEffect(() => {
    if (entries_delete_response?.code === 200) {
      go()
    }
  }, [entries_delete_response])

  const loadDraft = () => {
    const draft = localStorage.getItem(draftId)
    if (draft) {
      form.reset(JSON.parse(draft))
    }
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
    if (formOrig) {
      form.reset(formOrig)
    }
  }

  const go = (to = '/j') => {
    clearDraft()
    props.onClose?.()
    // send('entries_list_request', {})
    navigate(to)
  }

  function submit(formData: Entries.entries_post_request) {
    const data = {
      ...formData,
      generative: useStore.getState().creditActive,
      tags: tags,
    }

    // set created_at to undefined, which the server will (a) use now() as default for new
    // entries; or (b) skip with updates for existing entries
    if (!changedDate && data.created_at) {
      delete data.created_at
    }

    if (isNew) {
      send('entries_post_request', data)
    } else {
      send('entries_put_request', {...data, id})
    }
    if (formData.generative) {
      creditActivate()
    }
  }
  const submitHandler = form.handleSubmit(submit)

  const deleteEntry = async () => {
    if (isNew) {
      return
    }
    const title = entry.title || entry.ai_title || entry.created_at
    if (window.confirm(`Delete entry: ${title}?`)) {
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
    if (as) {
      return null
    }

    const generative = me?.premium || creditActive

    return <>
      {id && <>
        <Button
          className='btn-delete'
          sx={{marginRight: 'auto'}}
          color="warning"
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
      {!generative && <Button
        color="inherit"
        variant='contained'
        disabled={submitting}
        type="submit"
        className="btn-submit"
        onClick={submitHandler}
      >
        Submit
      </Button>}
      <BtnTryGenerative
        btnProps={{
          disabled: submitting,
          type: "submit",
          className: generative ? "btn-submit" : "btn-submit-ai"
        }}
        tryLabel={"AI Submit"}
        premiumLabel={"Submit"}
        submit={submitHandler}
      />
    </>
  }

  function datePicker() {
    // const [value, setValue] = React.useState<Dayjs>(dayjs(entry.created_at || new Date()));

    return (
      <Controller
        control={form.control}
        name="created_at"
        render={obj => <DatePicker
          {...obj}
          label="Date"
          format="YYYY-MM-DD"
          disableFuture
          value={dayjs(obj.field.value)}
          onChange={(newVal) => {
            setChangedDate(true)
            obj.field.onChange(newVal.format("YYYY-MM-DD"))
          }}
        />}
      />
    );
  }

  const suggestedNextEntry = useMemo(() => <SuggestEntry />, [])

  function renderForm() {
    return (
      <Stack
        className="form-upsert"
        spacing={2}
        direction='column'>

        {datePicker()}
        <TextField2
          name='title'
          label='Title'
          helperText='Leave blank if you want AI to generate a title based on your entry'
          form={form}
        />

        {suggestedNextEntry}

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
          codeRange={[400, 500]}
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
    );
  }

  return <Card
    className="upsert"
    sx={{borderRadius: 2, height: "100%", backgroundColor: "#ffffff"}}
  >
    <CardContent sx={{backgroundColor: "white"}}>
      {renderForm()}
      <CardActions sx={{backgroundColor: "white", justifyContent: "flex-end", alignItems: "flex-start", gap: 2, mt: 2}}>
        {/*viewing && <Box sx={{marginRight: 'auto'}}>
        <NoteCreate id={id} />
      </Box>*/}
        {renderButtons()}
      </CardActions>
    </CardContent>
  </Card>
}
