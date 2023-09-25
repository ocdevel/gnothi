import React, {useState, useEffect, useCallback, useMemo} from 'react'
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
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {ulid} from "ulid"
import Stack from "@mui/material/Stack";
import {shallow} from "zustand/shallow";
import {Stack2} from "../../../Components/Misc";
import BtnTryGenerative from '../../../Components/BtnTryGenerative'
import {SUMMARIZE_EMPTY, SUMMARIZE_DISABLED, SUMMARIZE_NOT_TRIGGERED} from "@gnothi/schemas/insights"

const get = useStore.getState

type Summarize = Insight & {
  entry_ids: string[]
  isTryGenerative?: boolean
}

function TryGenerative({view, entry_ids}: Summarize) {
  const me = useStore(s => s.user?.me)
  const [creditActive, creditActivate] = useStore(s => [s.creditActive, s.creditActivate], shallow)

  if (me?.premium || creditActive) {
    return null
  }

  function submit() {
    get().send("insights_get_request", {
      view,
      entry_ids,
      generative: true,
      insights: {
        summarize: true,
        query: "",
        books: false,
        prompt: undefined
      }
    })
  }

  // f8a18dd115e268833f7be9fb01dbf51a25f07f60 - content with "about this" and upgrade button
  return <BtnTryGenerative
    submit={submit}
    btnProps={{fullWidth: true}}
    tryLabel="Try Premium"
    premiumLabel={null}
  />
}

export function Summarize({view, entry_ids}: Summarize) {
  const entries = useStore(s => s.res.entries_list_response?.rows)
  const waiting = useStore(s => s.req.insights_get_request?.view === view)
  const summary = useStore(s => s.res.insights_summarize_response?.hash?.[view])
  // const themes = useStore(s => s.res.insights_themes_response?.hash?.[view])

  function renderSummary() {
    if (!entries?.length) {
      return <Typography className="result none">{SUMMARIZE_EMPTY}</Typography>
    }
    if (waiting) {return <LinearProgress />}
    // TODO consider removing the empty texts, since the server sends these anyway
    if (!summary) {
      return <Typography className="result none">{SUMMARIZE_NOT_TRIGGERED}</Typography>
    }
    const klass = summary.failed ? "result none" : "result ai"
    return <Box>
      {/*<Typography variant="h5">Summary</Typography>*/}
      <Typography className={klass} mb={2}>{summary.summary}</Typography>
      {/*<Typography variant="h5">Themes</Typography>*/}
      <Themes view={view} />
      <TryGenerative view={view} entry_ids={entry_ids} />
    </Box>
  }

  return <div className="summarize">
    {renderSummary()}
  </div>
}

// git-blamee for modal