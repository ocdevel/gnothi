import React, {useState, useEffect, useCallback} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"

import {useStore} from "@gnothi/web/src/data/store"
import Themes from './Themes.tsx'
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {LinearProgress} from "@mui/material";
import {Insight} from "./Utils";
import Box from "@mui/material/Box";
import {FullScreenDialog} from "../../../Components/Dialog.tsx";
import DialogContent from "@mui/material/DialogContent";

type Summarize = Insight & {
  expanded?: boolean
}
export function Summarize({view, expanded}: Summarize) {
  const entries = useStore(s => s.res.entries_list_response?.rows)
  const submitted = useStore(useCallback(s => !!s.res.insights_get_response?.hash?.[view], [view]))
  const summary = useStore(useCallback(s => s.res.insights_summarize_response?.hash?.[view], [view]))
  const themes = useStore(useCallback(s => s.res.insights_themes_response?.hash?.[view], [view]))

  const waiting = !summary && submitted

  // 26fecb16 - specify summary length

  // sent2face(reply_.sentiment)} {reply_.summary}

  function renderTeaser() {
    const words = themes?.themes?.map(t => t.word).join(', ')
    return <Box>
      <Typography className="result" mb={2}>{summary.summary}</Typography>
      {words && <Typography><strong>Themes:</strong> {words}</Typography>}
    </Box>
  }

  function renderExpanded() {
    return <Box>
      <Typography variant="h5">Summary</Typography>
      <Typography className="result" mb={2}>{summary.summary}</Typography>
      <Typography variant="h5">Themes</Typography>
      <Themes view={view} />
    </Box>
  }

  function renderSummary() {
    if (waiting) {return <LinearProgress />}
    if (!entries?.length) {
      return <Typography className="no-result">Nothing to summarize. Try adjusting filters</Typography>
    }
    if (!summary) {
      return <Typography className="no-result">No summary available</Typography>
    }
    if (expanded) {return renderExpanded()}
    return renderTeaser()
  }

  return <div className="summarize">
    {renderSummary()}
  </div>
}


export function SummarizeModal() {
  const view = useStore(s => s.modals.summary)
  const setView = useStore(useCallback(s => s.modals.setSummary, []))
  return <FullScreenDialog title={"Summary & Themes"} open={Boolean(view)} onClose={() => setView(null)}>
    <DialogContent>
      <Summarize view={view} expanded={true} />
    </DialogContent>
  </FullScreenDialog>
}