import React, {useCallback, useState, useEffect} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import {Create, Update} from "./Modal/Upsert/Upsert.tsx"
import {shallow} from "zustand/shallow";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {FullScreenDialog} from "../../Components/Dialog.tsx";
import Container from "@mui/material/Container";
import Behaviors from './List/Lane.tsx'
import KeepTracking from './Modal/KeepTracking.tsx'
import Charts from './Modal/Charts.tsx'
import TableQA from './Modal/TableQA.tsx'

const get = useStore.getState

// FIXME remove modal stuff fully, then export just the one component
export function Analyze() {
  return <Container maxWidth={false}>
    <Grid container direction="row" spacing={2}>
      <Grid item  xs={12} md={6}>
        {/*<Behaviors advanced={true} />*/}
        <Box sx={{mb:2}}></Box>
        <TableQA />
      </Grid>
      <Grid item xs={12} md={6}>
        <ModalContent />
      </Grid>
    </Grid>
  </Container>
}

export default function Modal() {
  return <div>app/behaviors/analyze.tsx, delete this</div>
}

function ModalContent() {
  return <div>app/behaviors/analyze.tsx, delete this</div>
}