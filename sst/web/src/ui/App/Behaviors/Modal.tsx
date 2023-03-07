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
import {FullScreenDialog} from "../../Components/Dialog";
import {ViewView, ViewPage} from "../../../data/store/behaviors";
import Container from "@mui/material/Container";

export default function Modal() {
  const [send, fields, view, setView] = useStore(s => [
    s.send,
    s.res.fields_list_response,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  function renderFields(fid: string, i: number) {
    const field = fields?.hash?.[fid]
    if (!field) {return null}
    return <Box
      onClick={() => setView({view: "edit", fid})}
      key={fid}
    >
      <Typography>{field.name}</Typography>
    </Box>
  }

  return <FullScreenDialog
    title="Behaviors"
    ctas={[{
      name: "Create",
      onClick: () => setView({view: "new", fid: null}),
    }]}
    open={view.page === "modal"}
    onClose={() => setView({page: view.lastPage})}
  >
    <Container maxWidth={false}>
      <Grid container direction="row">
        <Grid item xs={6}>
          {fields?.ids?.map(renderFields)}
        </Grid>
        <Grid item xs={6}>
          {view.view === "new" && <Create />}
          {view.view === "edit" && <Update />}
        </Grid>
      </Grid>
    </Container>
  </FullScreenDialog>
}
