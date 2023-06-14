import React, {useCallback, useEffect, useState, useMemo} from "react"
import {Helmet} from 'react-helmet-async'

import {All as NotesAll} from "../Notes/List";

import Grid from '@mui/material/Grid'
import Filters from '../../Insights/Filters'
import Insights from '../../Insights/Insights/Insights.tsx'
import Entries from "./Entries"
import Ask from '../../Insights/Insights/Ask'
import {useStore} from "../../../../data/store";

// pulled out here for optimization
function InsightsDashboard() {
  const ids = useStore(s => s.res.entries_list_response?.ids || [])
  return <Insights entry_ids={ids} />
}

export default function List({group_id=null}) {
  const entries = useStore(s => s.res.entries_list_response)
  const res = entries?.res
  if (res?.error && res.code === 403) {
    return <h5>{res.data}</h5>
  }

  return useMemo(() => <div className="list">
    <Helmet>
      <title>Gnothi AI Journal</title>
    </Helmet>
    <Filters />
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        <Ask view={'list'} />
        <Entries />
      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <InsightsDashboard />
        <NotesAll />
      </Grid>
    </Grid>
  </div>, [])
}
