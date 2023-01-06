import React, {useState, useEffect, useCallback} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"

import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {LinearProgress} from "@mui/material";
import {Insight} from "./Utils";

export default function Summarize({view}: Insight) {
  const submitted = useStore(useCallback(s => !!s.res.insights_get_response?.hash?.[view], [view]))
  const summary = useStore(useCallback(s => s.res.insights_summarize_response?.hash?.[view], [view]))
  const filters = useStore(s => s.filters)

  const waiting = !summary && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <LinearProgress />
  }

  if (!summary) {
    return <Typography>Nothing to summarize (try adjusting date range)</Typography>
  }

  // sent2face(reply_.sentiment)} {reply_.summary}
  return <Typography>{summary.summary}</Typography>
}
