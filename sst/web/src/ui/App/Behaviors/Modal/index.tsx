import React, {useCallback, useState, useEffect} from "react";
import _ from "lodash";
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";

import {useStore} from "@gnothi/web/src/data/store"
import {Create, Update} from "./Upsert"
import shallow from "zustand/shallow";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {FullScreenDialog} from "../../../Components/Dialog";
import Container from "@mui/material/Container";
import Behaviors from '../Behaviors'
import View from './View'
import Overall from './Overall'
import DayChanger from "../DayChanger";

export default function Modal() {
  const [send, fields, view, setView] = useStore(s => [
    s.send,
    s.res.fields_list_response,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  useEffect(() => {
    // no fields present. No matter why they came here, they
    // probably need to create a field first
    if (!fields?.ids?.length) {
      setView({view: "new", fid: null})
    }
  }, [fields])

  function renderDetails() {
    return <>
      {view.view === "new" && <Create />}
      {view.view === "edit" && <Update />}
      {view.view === "view" && <View />}
      {view.view === "overall" && <Overall />}
    </>
  }


  const onCta = useCallback(() => setView({view: "new", fid: null}), [])
  const onClose = useCallback(() => setView({page: view.lastPage}), [])

  return <FullScreenDialog
    className="behaviors modal"
    title="Behaviors"
    ctas={[{
      name: "Create",
      onClick: onCta,
    }]}
    open={view.page === "modal"}
    onClose={onClose}
  >
    <Container maxWidth={false}>
      <Grid container direction="row" spacing={2}>
        <Grid
          container
          item
          xs={12}
          md={6}
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          spacing={2}
        >
          {/*<Grid item>*/}
          {/*  <DayChanger />*/}
          {/*</Grid>*/}
          <Grid item>
            <Behaviors advanced={true} />
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          {renderDetails()}
        </Grid>
      </Grid>
    </Container>
  </FullScreenDialog>
}
