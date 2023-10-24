import React, {useCallback, useState, useEffect, useMemo} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import {Create, Update} from "../Upsert/Upsert.tsx"
import {shallow} from "zustand/shallow";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {FullScreenDialog} from "../../../Components/Dialog.tsx";
import Container from "@mui/material/Container";
import Behaviors from '../Track/Lane.tsx'
import KeepTracking from './KeepTracking.tsx'
import Charts from './Charts.tsx'
import TableQA from './TableQA.tsx'
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import {FieldName} from "../utils.tsx";

const get = useStore.getState

const laneOrder: Record<"habit"|"daily"|"todo"|"custom", number> = {
  habit: 0,
  daily: 1,
  todo: 2,
  custom: 3
};

// FIXME remove modal stuff fully, then export just the one component
export function Analyze() {
  const [
    me,
    user,
    view,
    behaviors,
  ] = useStore(s => [
    s.user?.me,
    s.user,
    s.behaviors.view,
    s.res.fields_list_response,
  ], shallow)
  const [
    send,
    setView
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.setView
  ], []))

  const onClick = useCallback((id: string) => () => {
    setView({view: "view", fid: id})
  }, [])

  const list = useMemo(() => {
    const sorted = (behaviors?.rows || [])
      .slice()
      .sort((a, b) => {
        // First, compare by lane
        const laneComparison = laneOrder[a.lane] - laneOrder[b.lane];
        if (laneComparison !== 0) return laneComparison;

        // If lanes are equal, compare by sort
        return a.sort - b.sort;
      })
    return sorted.map(behavior => <Behavior fid={behavior.id} key={behavior.id} />)
  }, [behaviors?.rows])


  return <Grid container direction="row" spacing={2}>
    <Grid item  xs={12} md={6}>
      {list}
      <TableQA />
    </Grid>
    <Grid item xs={12} md={6}>
      {
        ["overall", "view"].includes(view.view)
          ? <Charts fid={view.fid} />
          : <KeepTracking />
      }
    </Grid>
  </Grid>
}

function Behavior({fid}: {fid: string}) {
  const [
    behavior,
  ] = useStore(s => [
    s.res.fields_list_response?.hash?.[fid],
  ], shallow)
  const [
    setView
  ] = useStore(useCallback(s => [
    s.behaviors.setView
  ], []))

  const onClick = useCallback(() => {
    debugger
    setView({view: "view", fid})
  }, [])

  return <Card
    sx={{mb:1}}
    onClick={onClick}
  >
    <CardContent
      sx={{backgroundColor: "white"}}
    >
      <FieldName name={behavior.name} />
    </CardContent>
  </Card>
}

export default function Modal() {
  return <div>app/behaviors/analyze.tsx, delete this</div>
}