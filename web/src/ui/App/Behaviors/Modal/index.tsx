import React, {useCallback, useState, useEffect} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import {Create, Update} from "./Upsert"
import {shallow} from "zustand/shallow";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {FullScreenDialog} from "../../../Components/Dialog";
import Container from "@mui/material/Container";
import Behaviors from '../List'
import KeepTracking from './KeepTracking'
import Charts from './Charts'

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

export default function Modal() {
  const [as,  view] = useStore(s => [
    s.user?.as,
    s.behaviors.view,
  ], shallow)
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
    <Container maxWidth={false}>
      <Grid container direction="row" spacing={2}>
        <Grid item  xs={12} md={6}>
          <Behaviors advanced={true} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ModalContent />
        </Grid>
      </Grid>
    </Container>
  </FullScreenDialog>
}
