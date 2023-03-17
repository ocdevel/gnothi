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
import Behavior from './Behavior'
import View from './View'

export default function Modal() {
  const [send, fields, view, setView] = useStore(s => [
    s.send,
    s.res.fields_list_response,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  return <FullScreenDialog
    className="behaviors modal"
    title="Behaviors"
    ctas={[{
      name: "Create",
      onClick: () => setView({view: "new", fid: null}),
    }]}
    open={view.page === "modal"}
    onClose={() => setView({page: view.lastPage})}
  >
    <Container maxWidth={false}>
      <Grid container direction="row" spacing={2}>
        <Grid item xs={6}>
          {fields?.ids?.map(fid => <Behavior fid={fid} key={fid} />)}
        </Grid>
        <Grid item xs={6}>
          {view.view === "new" && <Create />}
          {view.view === "edit" && <Update />}
          {view.view === "view" && <View />}
        </Grid>
      </Grid>
    </Container>
  </FullScreenDialog>
}
