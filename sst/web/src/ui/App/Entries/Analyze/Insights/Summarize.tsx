import React, {useState, useEffect} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"

import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

export default function Summarize() {
  const submitted = useStore(s => !!s.res.insights_get_response?.first)
  const summary = useStore(s => s.res.insights_summarize_response)
  const filters = useStore(s => s.filters)

  const waiting = !summary?.first && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <CircularProgress />
  }

  if (!summary?.first) {
    return <Typography>Nothing to summarize (try adjusting date range)</Typography>
  }

  // sent2face(reply_.sentiment)} {reply_.summary}
  return <Typography>{summary.first.summary}</Typography>
}
