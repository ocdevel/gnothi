import React, {useState} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import {TextField2, Select2} from "@gnothi/web/src/ui/Components/Form";
import {useForm, Controller} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import * as S from "@gnothi/schemas"
import {fields_post_request} from "@gnothi/schemas/fields";
import {shallow} from "zustand/shallow";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CardActions from "@mui/material/CardActions";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Accordions from '../../../Components/Accordions'
import {Stack2} from "../../../Components/Misc.tsx"

export function Update() {
  const [send, fields, view, setView] = useStore(s => [
    s.send,
    s.res.fields_list_response?.hash,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  const fid = view.fid
  if (!fid) {return null}
  const field = fields?.[view.fid]
  // fields.hash not yet ready
  if (!field) {return null}

  const submit = (data: fields_post_request) => {
    console.log({data})
    send('fields_put_request', {id: fid, ...data})
  }
  return <Form submit={submit} field={field} />
}

export function Create() {
  const [send, setView] = useStore(s => [
    s.send,
    s.behaviors.setView
  ], shallow)

  const field = fields_post_request.omit({name: true}).parse({})
  const submit = (data: fields_post_request) => {
    console.log({data})
    send('fields_post_request', data)
  }
  return <Form submit={submit} field={field} />
}


interface Form {
  field: S.Fields.fields_list_response
  submit: (data: S.Fields.fields_post_request) => void
}

function Form({field, submit}: Form) {
  const [send, view, setView, ] = useStore(s => [
    s.send,
    s.behaviors.view,
    s.behaviors.setView,
  ], shallow)

  const form = useForm({
    resolver: zodResolver(S.Fields.fields_post_request),
    defaultValues: field
  })

  const fid = field.id || null

  React.useEffect(() => {
    form.reset(field)
  }, [fid])

  console.log(form.formState.errors)

  const [type, default_value] = form.watch(['type', 'default_value'])

  function close() {
    // close the new-field (upsert) form, NOT the modal. Just go
    // back to overview mode
    setView({view: "overall", fid: null})
  }

  // function submit_(data: fields_post_request) {
  //   submit(data)
  //   close()
  // }

  const destroyField = async () => {
    if (!fid) {return}
    if (!window.confirm("Are you sure? This will delete all data for this field.")) {
      return
    }
    send('fields_delete_request', {id: fid})
    close()
  }

  const excludeField = async (exclude=true) => {
    send('fields_exclude_request', {id: fid, exclude})
    // close(false)
  }

  let defValHelp = {
    value: `Auto-populate this field with "Default Value". Leaving it empty is valid (blanks are considered by ML models)`,
    ffill: `Pulls the value from your last entry for this field`,
    average: `Uses your average accross entries for this field`
  }
  const lastEntry = fid && _.last(field.history)
  if (lastEntry) { // only show if have values to work with
    defValHelp.ffill += ` (currently ${lastEntry.value})`
    defValHelp.average += ` (currently ${field.avg})`
  }
  defValHelp = defValHelp[default_value]

  function renderDeleteButtons() {
    if (!fid) {return null}
    return  <Stack direction='row' spacing={2}>
      <Stack alignItems='center' flex={1}>
        <Button
          className="btn-delete"
          color='error'
          disabled={!!field.service}
          onClick={destroyField}
          size='small'
        >Delete</Button>
        {field.service ? <Typography variant='body2'>
          Delete this field at the source. To exclude from Gnothi, click "Remove".
        </Typography> : <Typography variant='body2'>
          Permanently delete this field and all its entries
        </Typography>}
      </Stack>
      <Divider orientation='vertical' flexItem />
      <Stack alignItems='center' flex={1}>
        {field.excluded_at ? <>
          <Button
            color='info'
            onClick={() => excludeField(false)}
            size='small'
          >Include</Button>
          <Typography variant='body2'>Bring this field back</Typography>
        </> : <>
          <Button
            className='btn-remove'
            color='error'
            onClick={() => excludeField(true)}
            size='small'
          >Exclude</Button>
          <Typography variant='body2'>Don't delete this field, but exclude it from showing up starting now. Fewer fields means easier machine learning. Consider "Remove"-ing irrelevant imported fields.</Typography>
        </>}
      </Stack>
    </Stack>
  }

  return <Card  className="upsert" sx={{backgroundColor: "#ffffff", borderRadius: 2}}>
    <CardContent>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
        <Typography variant="h4" m={0}>{fid ? "Edit Behavior" : "New Behavior"}</Typography>
        <CardActions sx={{justifyContent: 'flex-end'}}>
          <Button size="small" onClick={close}>Cancel</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={form.handleSubmit(submit)}
            className="btn-save"
            size="small"
          >
            Save
          </Button>
        </CardActions>
      </Stack>
    <Stack
      spacing={2}
      sx={{minWidth:400}}
    >
      <TextField2
        name='name'
        label="Name"
        placeholder="Add the behavior you'd like to track"
        className='input-name'
        form={form}
      />
      <Select2
        name='type'
        label="Type"
        form={form}
        options={[
          {value: 'number', label: "Number"},
          {value: 'fivestar', label: "Fivestar"},
          {value: 'check', label: "Check"},
        ]}
      />
      <Accordions accordions={[
        {
          title: "Advanced",
          content: <Stack2>
            <Select2
              name='default_value'
              label="Default"
              form={form}
              options={[
                {value: 'value', label: "Specific value (including empty)"},
                {value: 'ffill', label: "Pull entry from yesterday"},
                {value: 'average', label: "Average of your entries"},
              ]}
              helperText={defValHelp}
            />
            {default_value === 'value' && <>
              <TextField2
                name='default_value_value'
                className="input-default_value_value"
                label="Default Value"
                type="number"
                form={form}
                min={type === 'check' ? 0 : null}
                max={type === 'check' ? 1 : null}
              />
            </>}
            {renderDeleteButtons()}
          </Stack2>
        }
      ]} />
    </Stack>


    </CardContent>
  </Card>
}
