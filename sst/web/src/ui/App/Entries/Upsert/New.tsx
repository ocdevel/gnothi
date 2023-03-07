import React from 'react'
import Grid from '@mui/material/Grid'
import {useStore} from "../../../../data/store";
import Upsert from "./Upsert"
import Behaviors from "../../Behaviors/Behaviors"

export default function New() {
  const setEntryModal = useStore(s => s.setEntryModal)
  function onCreate() {
    // if (window.localStorage.getItem("testing")) { return }
    setEntryModal(null)
  }

  return  <>
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        <Upsert onClose={onCreate}/>

      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Behaviors  />
      </Grid>
    </Grid>
  </>
}
