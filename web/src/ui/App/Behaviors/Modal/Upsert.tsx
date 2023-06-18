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
import Box from "@mui/material/Box";

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
    value: `Recommended if you don't plan on tracking behaviors daily`,
    ffill: `Auto-populates with the value from your last entry for this field`,
    average: `Defaults to the average across all your entries for this field`
  }
  const lastEntry = fid && _.last(field.history)
  if (lastEntry) { // only show if have values to work with
    defValHelp.ffill += ` (currently ${lastEntry.value})`
    defValHelp.average += ` (currently ${field.avg})`
  }
  defValHelp = defValHelp[default_value]

  const typeHelp = {
    number: "Track quantities, like hours slept or glasses of water",
    fivestar: "Rate aspects of your life. Perfect for things like mood, productivity, etc",
    check: "Simple yes or no for daily habits, like exercise or meditation"
  }[type]


  function renderDeleteButtons() {
    if (!fid) {return null}
    return <Stack>
       <Typography mt={3} color="primary" variant={"body1"} fontWeight={500}>Delete or exclude a behavior</Typography>
      <Typography mb={3} variant="body2">Excluding a behavior temporarily removes it from showing up, optimizing machine learning with fewer fields, while <u><i>deleting permanently erases the behavior</i></u> and all associated values.</Typography>

    <Stack direction='row'>
      <Stack alignItems='center' flex={1}>
          <Button
          className="btn-delete"
          color='error'
          disabled={!!field.service}
          onClick={destroyField}
          size='small'
        >Delete</Button>
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
        </>}
      </Stack>
      </Stack>
    </Stack>
  }

  return <Card  className="upsert"
                sx={{backgroundColor: "#ffffff",
                  borderRadius: 2,
                  }}>
    <CardContent>
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
        <Typography variant="h4" color="primary" fontWeight={500} m={0}>{fid ? "Edit" : "Add New"}</Typography>
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
    >
      <TextField2
        name='name'
        label="Name"
        placeholder="Add the behavior you want to track (you can use emojis too). Keep names short and sweet."
        className='input-name'
        form={form}
      />
        <Select2
          name='type'
          label="Type"
          form={form}
          options={[
            {value: 'number', label: "Number"},
            {value: 'fivestar', label: "Five-Star"},
            {value: 'check', label: "Check"},
          ]}
          helperText={typeHelp}
        />
      <Accordions sx={{mt: 2}} accordions={[
        {
          title: "Advanced",
          content: <Box mb={3}>
            <Typography color="primary" variant={"body1"} fontWeight={500}>Setting a default value</Typography>
            <Typography mb={3} variant="body2">Default values are automatically assigned to your fields on days you don't manually update them, based on the option you select here.</Typography>
            <Select2
              name='default_value'
              label="Default"
              form={form}
              options={[
                {value: 'value', label: "Manual Default (Recommended)"},
                {value: 'ffill', label: "Yesterday's value"},
                {value: 'average', label: "Average Value"},
              ]}
              helperText={defValHelp}
            />
             <Box mt={2}>
            {default_value === 'value' && <>
              <TextField2
                name='default_value_value'
                className="input-default_value_value"
                label="Default Value"
                type="number"
                form={form}
                min={type === 'check' ? 0 : null}
                max={type === 'check' ? 1 : null}
                // helperText="Fill in the value which will be populated if you don't track for this day. Alternatively, you can leave it blank. If youdon't know, it's recommended alkfejkalseu rdfoiuase "
              />
            </>}
               </Box>
            {renderDeleteButtons()}
          </Box>
        }
      ]} />
    </Stack>


    </CardContent>
  </Card>
}
