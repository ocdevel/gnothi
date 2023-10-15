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

function ModalContent() {
  const [fields, view] = useStore(s => [
    s.res.fields_list_response,
    s.behaviors.view.view,
  ], shallow)
  const setView = useStore(useCallback(s => s.behaviors.setView, []))

  useEffect(() => {
    // no fields present. No matter why they came here, they
    // probably need to create a field first
    if (!fields?.ids?.length) {
      setView({view: "new", fid: null})
    }
  }, [fields?.ids?.join("")])

  return <>
    {view === "new" && <Create />}
    {view === "edit" && <Update />}
    {["overall","view"].includes(view) && <Charts />}
  </>
}

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
  const [user,  view] = useStore(s => [
    s.user,
    s.behaviors.view,
  ], shallow)
  const [as, me] = [user?.as, user?.me]
  const [setView] = useStore(useCallback(s => [s.behaviors.setView], []))

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

  const onClose = useCallback(() => setView({page: view.lastPage}), [])

  return <FullScreenDialog
    title=""
    className="behaviors modal"
    ctas={ctas}
    open={view.page === "modal"}
    onClose={onClose}
  >
    <ModalContent />
  </FullScreenDialog>
}
