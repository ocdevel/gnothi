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
import shallow from "zustand/shallow";


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
  const [send, view, setView] = useStore(s => [
    s.send,
    s.behaviors.view,
    s.behaviors.setView
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

  function submit_(data: fields_post_request) {
    submit(data)
    close()
  }

  const destroyField = async () => {
    if (!fid) {return}
    if (!window.confirm("Are you sure? This will delete all data for this field.")) {
      return
    }
    send('fields_delete_request', {id: fid})
    close()
  }

  const excludeField = async (exclude=true) => {
    const body = {excluded_at: exclude ? new Date() : null}
    send('fields_exclude_request', {id: fid, body})
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

  return <div className="upsert">
    <Grid
      container
      spacing={2}
      direction='column'
      sx={{minWidth:400}}
    >
      <Grid item>
        <TextField2
          name='name'
          label="Name"
          className='input-name'
          form={form}
        />
      </Grid>
      <Grid item>
        <Select2
          name='type'
          label="Field Type"
          form={form}
          options={[
            {value: 'number', label: "Number"},
            {value: 'fivestar', label: "Fivestar"},
            {value: 'check', label: "Check"},
          ]}
        />
      </Grid>
      <Grid item>
        <Select2
          name='default_value'
          label="Field Default"
          form={form}
          options={[
            {value: 'value', label: "Specific value (including empty)"},
            {value: 'ffill', label: "Pull entry from yesterday"},
            {value: 'average', label: "Average of your entries"},
          ]}
          helperText={defValHelp}
        />
      </Grid>
      {default_value === 'value' && (
        <Grid item>
          <TextField2
            name='default_value_value'
            className="input-default_value_value"
            label="Default Value"
            type="number"
            form={form}
            min={type === 'check' ? 0 : null}
            max={type === 'check' ? 1 : null}
          />
        </Grid>
      )}
    </Grid>

    {fid && (
      <>
        <hr/>
        <div className='mb-3'>
          <Button
            color='error'
            disabled={field.service}
            onClick={destroyField}
            size='small'
          >Delete</Button>
          <br/>
          <small
            style={field.service ? {textDecoration: 'line-through'}: {}}
            className='text-muted'
          >
            Permenantly delete this field and all its entries
          </small>
          {field.service && <>
            <br/>
            <small className='text-muted'>Delete this field at the source. To exclude from Gnothi, click "Remove".</small>
          </>}

        </div>
        <div>
          {field.excluded_at ? (
            <>
            <Button
              color='info'
              onClick={() => excludeField(false)}
              size='small'
            >Include</Button>
            <br/>
            <small className='text-muted'>Bring this field back</small>
            </>
          ) : (
            <>
            <Button
              color='error'
              onClick={() => excludeField(true)}
              size='small'
            >Remove</Button>
            <br/>
            <small className='text-muted'>Don't delete this field, but exclude it from showing up starting now. Fewer fields means easier machine learning. Consider "Remove"-ing irrelevant imported fields.</small>
            </>
          )}
        </div>
      </>
    )}

    <Button size="small" onClick={close}>Cancel</Button>
    <Button
      color="primary"
      variant="contained"
      onClick={form.handleSubmit(submit)}
      className="btn-save"
    >
      Save
    </Button>
  </div>
}
