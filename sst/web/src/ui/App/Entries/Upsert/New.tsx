import React from 'react'
import Grid from '@mui/material/Grid'
import {useStore} from "../../../../data/store";
const Upsert = React.lazy(() => import("./Upsert"))
const Fields = React.lazy(() => import("../../Fields/Fields"))

export default function New() {
  const setEntryModal = useStore(s => s.setEntryModal)
  function onCreate() {
    // if (searchParams.get('redirect')) {
    if (window.localStorage.getItem("testing") !== "true") {
      setEntryModal(null)
    }
  }

  return  <>
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        <Upsert onClose={onCreate}/>

      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Fields  />
      </Grid>
    </Grid>
  </>
}
