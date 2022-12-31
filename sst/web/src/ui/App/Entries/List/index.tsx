import React, {useCallback, useEffect, useState} from "react"
import {Helmet} from 'react-helmet-async'

import {NotesAll, NotesNotifs} from "../Notes";

import Grid from '@mui/material/Grid'
import Filters from '../Insights/Filters'
import Insights from '../Insights/Insights'
import Entries from "./Entries"
import Ask from '../Insights/Insights/Ask'


export default function List({group_id=null}) {
  return <>
    <Helmet>
      <title>Insights</title>
    </Helmet>
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        <Filters />
        <Ask />
        <Entries />
      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Insights />
        <NotesAll />
      </Grid>
    </Grid>
  </>
}
