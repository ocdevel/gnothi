import React from 'react'
import Grid from '@mui/material/Grid'
import {useStore} from "../../../../data/store";
import Upsert from "./Upsert"
import Behaviors from "../../Behaviors/Track/Lane.tsx"
import DialogContent from "@mui/material/DialogContent";

export default function New() {
  const setEntryModal = useStore(s => s.modals.setEntry)
  function onClose() {
    // if (window.localStorage.getItem("testing")) { return }
    setEntryModal(null)
  }

  return  <div>
    <Grid container spacing={2}>
      <Grid item sm={12} lg={7}>
        <Upsert onClose={onClose} />
      </Grid>
      <Grid item sm={12} lg={5} >
        <Behaviors advanced={false}/>
      </Grid>
    </Grid>
  </div>
}
