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
import Accordions from '../../../Components/Accordions.tsx'
import {Stack2} from "../../../Components/Misc.tsx"
import Box from "@mui/material/Box";
import {BehaviorType} from "./BehaviorType.tsx";
import {BehaviorLane} from "./BehaviorLane.tsx";
import {BehaviorValue} from "./BehaviorValue.tsx";
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {DeleteButton} from "./DeleteButton.tsx";
import {AnalyzeAdvanced} from "./AnalyzeAdvanced.tsx";
import {ResetPeriods} from "./ResetPeriods.tsx";
import {BehaviorNotes} from './BehaviorNotes.tsx'
import {TrackingType} from "./TrackingType.tsx";
import {ScoreAdvanced} from "./ScoreAdvanced.tsx";
import {FullScreenDialog} from "../../../Components/Dialog.tsx";
import Charts from "../Analyze/Charts.tsx";
import {useFormWatcher} from "./useFormWatcher.tsx";
import ReactMarkdown from "react-markdown";

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
  const [
    setView,
    send
  ] = useStore(useCallback(s => [
    s.behaviors.setView,
    s.send
  ], []))

  const {as, me} = user || {}

  const [form, field, fid] = useFormWatcher()
  const lane = form.watch("lane")

  const upsertProps: UpsertProps = fid ? {form, field, isNew: false}
    : {form, isNew: true}

  console.log(form.formState.errors)

  const onClose = useCallback(() => setView({view: null, fid: null}), [])
  const open = ["new", "edit"].includes(view.view)


  const submit = useCallback((data: fields_post_request) => {
    if (fid) {
      send('fields_put_request', {id: field.id, ...data})
    } else {
      send("fields_post_request", data)
    }
    onClose()
  }, [fid])

  const ctas = as ? [] : [
    {
      name: "Save",
      // secondary: true,
      onClick: form.handleSubmit(submit)
    },
  ]

  const destroy = useCallback(() => {
    if (!fid) {return}
    if (!window.confirm("Delete this Behavior? This will delete all data for this field.")) {
      return
    }
    onClose()
    send('fields_delete_request', {id: fid})
  }, [fid])

  function renderForm() {
    return <Card
      className="upsert"
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: 2,
      }}
    >
      <CardContent
        component="form"
        onSubmit={form.handleSubmit(submit)}
      >
        <Stack2>
          <WithHelp
            field={<TextField2
              name='name'
              label="Name"
              placeholder="Title of behavior to track"
              className='input-name'
              form={form}
              autoFocus
            />}
            help={<Typography>Add the behavior you want to track. You can use Markdown (eg for links) and emojis. But try to keep it short, due to display formatting.</Typography>}
          />
          {lane === "reward" ? <>
            <BehaviorLane {...upsertProps} />
            <TrackingType {...upsertProps} />
            <BehaviorValue {...upsertProps} />
            <BehaviorNotes {...upsertProps} />
          </> : <>
            <BehaviorLane {...upsertProps} />
            <BehaviorType {...upsertProps} />
            <TrackingType {...upsertProps} />
            <BehaviorNotes {...upsertProps} />
            <ResetPeriods {...upsertProps} />
            <Accordions
              defaultExpanded={0}
              accordions={[
                {
                  title: "Advanced",
                  content: <Stack2>
                    <AnalyzeAdvanced {...upsertProps} />
                    <ScoreAdvanced {...upsertProps} />
                    <DeleteButton {...upsertProps} />
                  </Stack2>
                }
              ]}
            />
          </>}
          <ShowMore f={field} />
        </Stack2>
        <button type='submit' style={{display: 'none'}}>Submit</button>
      </CardContent>
    </Card>
  }

  return <>
    <FullScreenDialog
      title={fid ? "Edit" : "Add New"}
      className="behaviors upsert"
      ctas={ctas}
      open={open}
      onClose={onClose}
    >
      {renderForm()}
      {["overall","view"].includes(view) && <Charts />}
    </FullScreenDialog>
  </>
}

function ShowMore({f}: {fields_list_response}) {
  const [show, setShow] = useState(false)
  const fieldDump = "```json\n" + JSON.stringify(f, null, 2) + "\n```"
  if (!show) {
    return <Button onClick={() => setShow(true)}>Show More</Button>
  }
  return <Box>
    <h6>Coming features:</h6>
    <ul>
      <li>Nested items. Hoping for infinite trees, like Workflowy</li>
      <li>Due dates (start, end). Especially for ToDos</li>
      <li>More complex point system, using Sigmoid curve (rather than everything is + / - 1).</li>
      <li>Display read-only parts (score_total, score_period)</li>
    </ul>
    <ReactMarkdown>
      {fieldDump}
    </ReactMarkdown>
  </Box>
}


interface UpsertProps {
  form: UseFormReturn<fields_post_request>
}
