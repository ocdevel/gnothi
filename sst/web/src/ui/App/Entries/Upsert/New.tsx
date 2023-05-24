import React from 'react'
import Grid from '@mui/material/Grid'
import {useStore} from "../../../../data/store";
import Upsert from "./Upsert"
import Behaviors from "../../Behaviors/List"

export default function New() {
  const setEntryModal = useStore(s => s.setEntryModal)
  function onClose() {
    // if (window.localStorage.getItem("testing")) { return }
    setEntryModal(null)
  }

  return  <div>
    <Grid container>
      <Grid item sm={12} md={7} lg={8}>
        <Upsert onClose={onClose} />

      </Grid>
      <Grid item sm={12} md={5} lg={4} >
        <Behaviors advanced={false}/>
      </Grid>
    </Grid>
  </div>
}
