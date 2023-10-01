import React, {useEffect, useState} from "react";
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
import Accordions from '../../../../Components/Accordions.tsx'
import {Stack2} from "../../../../Components/Misc.tsx"
import Box from "@mui/material/Box";
import {SelectTemplate} from "./SelectTemplate.tsx";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {DeleteButtons} from "./DeleteExclude.tsx";
import {DefaultValues} from "./DefaultValues.tsx";
import {ResetPeriods} from "./ResetPeriods.tsx";
import {TrackingType} from "./TrackingType.tsx";

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

  const form = useForm<fields_post_request>({
    resolver: zodResolver(fields_post_request),
    defaultValues: field
  })

  const fid = field.id || null

  const upsertProps: UpsertProps = fid ? {form, field, isNew: false}
    : {form, isNew: true}

  React.useEffect(() => {
    form.reset(field)
  }, [fid])

  console.log(form.formState.errors)

  function close() {
    // close the new-field (upsert) form, NOT the modal. Just go
    // back to overview mode
    setView({view: "overall", fid: null})
  }

  // function submit_(data: fields_post_request) {
  //   submit(data)
  //   close()
  // }


  return <Card
    className="upsert"
    sx={{
      backgroundColor: "#ffffff",
      borderRadius: 2,
    }}
  >
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
    <Stack2>
      <WithHelp
        field={<TextField2
          name='name'
          label="Name"
          placeholder="Title of behavior to track"
          className='input-name'
          form={form}
        />}
        help={<Typography>Add the behavior you want to track. You can use Markdown (eg for links) and emojis. But try to keep it short, due to display formatting.</Typography>}
      />
      <SelectTemplate {...upsertProps} />
      <TrackingType {...upsertProps} />
      <ResetPeriods {...upsertProps} />
      <Accordions sx={{mt: 2}} accordions={[
        {
          title: "Advanced",
          content: <Box mb={3}>
            <DefaultValues {...upsertProps} />
            <DeleteButtons {...upsertProps} />
          </Box>
        }
      ]} />
    </Stack2>


    </CardContent>
  </Card>
}
