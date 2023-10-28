import React, {useCallback, useState, useEffect, useMemo} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import {shallow} from "zustand/shallow";
import Grid from "@mui/material/Grid";
import {Behaviors} from './Behaviors.tsx'
import {NotEnough, Upgrade} from './AnalyzeDisabled.tsx'
import Charts from './Charts.tsx'
import TableQA from './TableQA.tsx'
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import {FieldName} from "../Utils.tsx";
import Typography from "@mui/material/Typography";

const get = useStore.getState


// FIXME remove modal stuff fully, then export just the one component
export function Analyze() {
  const [
    me,
    creditActive,
    view,
  ] = useStore(s => [
    s.user?.me,
    s.creditActive,
    s.behaviors.view,
  ], shallow)
  const [
    send,
    setView
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.setView
  ], []))

  useEffect(() => {
    // If they got here from the tab (rather than redirected from a behavior), show the overall stats by default
    if (view.view !== "view") {
      setView({view: "overall", fid: null})
    }
  }, [])

  if (!(me?.premium || creditActive)) {
    return <Upgrade />
  }

  return <Grid container direction="row" spacing={2}>
    <Grid item  xs={12} md={6}>
      <Behaviors />
      <TableQA />
    </Grid>
    <Grid item xs={12} md={6}>
      {
        ["overall", "view"].includes(view.view)
          ? <Charts fid={view.fid} />
          : <Typography>Click a behavior on the left to analyze</Typography>
      }
    </Grid>
  </Grid>
}