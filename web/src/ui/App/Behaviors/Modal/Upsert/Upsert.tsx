import React, {useCallback, useEffect, useMemo, useState} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import {TextField2, Select2} from "@gnothi/web/src/ui/Components/Form";
import {useForm, Controller, UseFormReturn} from "react-hook-form"
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
import {BehaviorTemplate, BehaviorType} from "./BehaviorType.tsx";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {DeleteButtons} from "./DeleteExclude.tsx";
import {AnalyzeAdvanced} from "./AnalyzeAdvanced.tsx";
import {ResetPeriods} from "./ResetPeriods.tsx";
import {TrackingType} from "./TrackingType.tsx";
import {ScoreAdvanced} from "./ScoreAdvanced.tsx";
import {FullScreenDialog} from "../../../../Components/Dialog.tsx";
import Charts from "../Charts.tsx";
import TemplateHelp from "./Help/Template.mdx";

export function UpsertModal() {
  const [
    fields,
    view,
    user
  ] = useStore(s => [
    s.res.fields_list_response,
    s.behaviors.view,
    s.user,
  ], shallow)
  const [setView] = useStore(useCallback(s => [s.behaviors.setView], []))

  const {as, me} = user || {}

  const form = useForm<fields_post_request>({
    resolver: zodResolver(fields_post_request),
  })
  useLaneWatcher(form)

  useEffect(() => {
    if (view.view === "new") {
      // Effectively a reset, see useLaneWatcher
      form.setValue("lane", view.fid || "habit")
    }
    if (view.view === "edit") {
      form.reset(fields.hash[view.fid])
    }
  }, [view])

  const onCta = useCallback(() => setView({view: "new", fid: null}), [])
  const ctas = as ? [] : [
    // {
    //   name: "Top Influencers",
    //   secondary: true,
    //   onClick: () => setView({view: "overall"}),
    // },
    // {
    //   name: "Add Behavior",
    //   onClick: onCta,
    // }
  ]

  const onClose = useCallback(() => setView({view: null, fid: null}), [])
  const open = ["new", "edit"].includes(view.view)

  return <>
    <FullScreenDialog
      title=""
      className="behaviors upsert"
      ctas={ctas}
      open={open}
      onClose={onClose}
    >
      {view.view === "new" && <Create form={form} />}
      {view.view === "edit" && <Update form={form} />}
      {["overall","view"].includes(view) && <Charts />}
    </FullScreenDialog>
  </>
}


interface UpsertProps {
  form: UseFormReturn<fields_post_request>
}

export function Update({form}: UpsertProps) {
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
  return <Form submit={submit} field={field} form={form} />
}

export function Create({form}: UpsertProps) {
  const [send, setView] = useStore(s => [
    s.send,
    s.behaviors.setView
  ], shallow)

  const field = fields_post_request.omit({name: true}).parse({})
  const submit = (data: fields_post_request) => {
    console.log({data})
    send('fields_post_request', data)
  }
  return <Form submit={submit} field={field} form={form}/>
}


interface Form {
  field: S.Fields.fields_list_response
  submit: (data: S.Fields.fields_post_request) => void
}

function Form({field, submit, form}: Form) {
  const [send, view, setView, ] = useStore(s => [
    s.send,
    s.behaviors.view,
    s.behaviors.setView,
  ], shallow)

  const fid = field.id || null

  const upsertProps: UpsertProps = fid ? {form, field, isNew: false}
    : {form, isNew: true}

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
      <BehaviorTemplate {...upsertProps} />
      <BehaviorType {...upsertProps} />
      <TrackingType {...upsertProps} />
      <ResetPeriods {...upsertProps} />
      <Accordions
        defaultExpanded={0}
        accordions={[
          {
            title: "Advanced",
            content: <Stack2>
              <AnalyzeAdvanced {...upsertProps} />
              <ScoreAdvanced {...upsertProps} />
              <DeleteButtons {...upsertProps} />
            </Stack2>
          }
        ]}
      />
      <Box>
        <h6>Missing features:</h6>
        <ul><li>due dates (start, end)</li>
          <li>read-only parts (score_total, score_period, streak)</li>
          <li>notes</li>
        </ul>
      </Box>
    </Stack2>


    </CardContent>
  </Card>
}

function useLaneWatcher(form: UpsertProps['form']) {
  const lane = form.watch("lane")
  useEffect(() => {
    // FIXME there's no form.setValues() (multiple), and instead there's form.reset({values}); but that resets
    // things like subscriptions, dirty states, etc. Which sucks, because the below causes a ton of re-renders
    if (lane === "custom") {
      form.setValue("score_enabled", false)
      form.setValue("analyze_enabled", true)
      form.setValue("type", "fivestar")
      return
    }

    form.setValue("score_enabled", true)
    form.setValue("analyze_enabled", true)
    form.setValue("reset_every", 1)
    form.setValue("monday", true)
    form.setValue("tuesday", true)
    form.setValue("wednesday", true)
    form.setValue("thursday", true)
    form.setValue("friday", true)
    form.setValue("saturday", true)
    form.setValue("sunday", true)
    form.setValue("reset_quota", 1)
    if (lane === "habit") {
      form.setValue("type", "number")
      form.setValue("reset_period", "daily")
      return
    }
    if (lane === "daily") {
      form.setValue("type", "check")
      form.setValue("reset_period", "daily")
      form.setValue("default_value", "value")
      form.setValue("default_value_value", 0)
      return
    }
    if (lane === "todo") {
      form.setValue("type", "check")
      form.setValue("reset_period", "forever")
      form.setValue("score_up_good", true)
      return
    }
    if (lane === "reward") {
      form.setValue("type", "number")
      form.setValue("reset_period", "forever")
      form.setValue("score_up_good", false)
      return
    }
  }, [lane])
  return null
}