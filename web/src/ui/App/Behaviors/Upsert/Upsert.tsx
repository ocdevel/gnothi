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
import {UpsertProps, WithHelp} from "./Utils.tsx";
import {DeleteButtons} from "./DeleteExclude.tsx";
import {AnalyzeAdvanced} from "./AnalyzeAdvanced.tsx";
import {ResetPeriods} from "./ResetPeriods.tsx";
import {TrackingType} from "./TrackingType.tsx";
import {ScoreAdvanced} from "./ScoreAdvanced.tsx";
import {FullScreenDialog} from "../../../Components/Dialog.tsx";
import Charts from "../Analyze/Charts.tsx";
import {useFormWatcher} from "./useFormWatcher.tsx";

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

  const upsertProps: UpsertProps = fid ? {form, field, isNew: false}
    : {form, isNew: true}

  console.log(form.formState.errors)

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


  function submit(data: fields_post_request) {
    if (fid) {
      send('fields_put_request', {id: field.id, ...data})
    } else {
      send("fields_post_request", data)
    }
    onClose()
  }

  function renderForm() {
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
        <BehaviorLane {...upsertProps} />
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

  return <>
    <FullScreenDialog
      title=""
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


interface UpsertProps {
  form: UseFormReturn<fields_post_request>
}
