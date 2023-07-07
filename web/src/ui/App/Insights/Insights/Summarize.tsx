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

const get = useStore.getState

type Summarize = Insight & {
  entry_ids: string[]
  isTryPremium?: boolean
}

function TryPremium({view, entry_ids}: Summarize) {
  const [clicked, setClicked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [readMore, setReadMore] = useState(false)
  const premiumView = `${view}premium`
  const waiting = useStore(s => s.req.insights_get_request?.view === premiumView)

  function submit() {
    if (!clicked) {
      return setClicked(true)
    }
    setSubmitted(true)
    get().send("insights_get_request", {
      view: premiumView,
      entry_ids,
      tryPremium: true,
      insights: {
        summarize: true,
        query: "",
        books: false,
        prompt: undefined
      }
    })
  }
  if (submitted) {
    // effectively only allows to try this once per browsing session; but this is just a "sure that works" until
    // I figure out a better way to track/identify which responses came from try-premium, reset the button, etc.
    return <Card sx={{mb:2}}>
      <CardContent>
        <Summarize isTryPremium={true} view={premiumView} entry_ids={entry_ids} />
        {!waiting && <Button color="secondary" variant="contained" fullWidth onClick={() => get().modals.setPremium(true)}>Upgrade</Button>}
      </CardContent>
    </Card>
  }
  if (!clicked) {
    return <Button
      color="secondary"
      fullWidth
      onClick={submit}
      sx={{mb: 2}}
    >
      See Premium's Version
    </Button>
  }
  const readMoreBtn = readMore ? null : <span style={{cursor: "pointer", textDecoration: "underline"}} onClick={() => setReadMore(true)}>Read more</span>
  return <Card sx={{mb: 2}}>
    <Stack component={CardContent} spacing={2}>
      {readMore
        ? <Typography>When you save a journal entry, a <strong>summary</strong> and <strong>themes</strong> are generated and saved with it. Those outputs are used in downstream AI tasks. Better outputs at save-time result in stronger AI results later. You can test-drive how Free and Premium compare here, but it's a read-only snapshot. Upgrading will re-generate summaries & themes for your existing entries, and use GPT going forward. <a href="https://github.com/ocdevel/gnothi/issues/160" target="_blank">Read more here</a>.</Typography>
        : <Typography>Premium can improve results. Test-drive it here. Upgrading applies it to entry saves. {readMoreBtn}</Typography>
      }
      <Button color="secondary" fullWidth variant="contained" onClick={submit}>Generate</Button>
      <Typography variant="body2">This uses GPT. See OpenAI's <a href="https://openai.com/policies/privacy-policy" target="_blank">privacy policy</a> and <a href="https://openai.com/policies/terms-of-use" target="_blank">terms of use</a></Typography>
    </Stack>
  </Card>
}

export function Summarize({view, entry_ids, isTryPremium=false}: Summarize) {
  const premium = useStore(s => s.user?.me?.premium)
  const entries = useStore(s => s.res.entries_list_response?.rows)
  const waiting = useStore(s => s.req.insights_get_request?.view === view)
  const summary = useStore(s => s.res.insights_summarize_response?.hash?.[view])
  // const themes = useStore(s => s.res.insights_themes_response?.hash?.[view])

  const tryPremium = useMemo(() => {
    if (premium) {return null}
    if (isTryPremium) {return null}
    return <TryPremium view={view} entry_ids={entry_ids} />
  }, [view, entry_ids, premium])

  function renderSummary() {
    if (waiting) {return <LinearProgress />}
    if (!entries?.length) {
      return <Typography className="no-result">Nothing to summarize. Try adjusting filters</Typography>
    }
    if (!summary) {
      return <Typography className="no-result">No summary available</Typography>
    }
    return <Box>
      {/*<Typography variant="h5">Summary</Typography>*/}
      {tryPremium}
      <Typography className="result" mb={2}>{summary.summary}</Typography>
      {/*<Typography variant="h5">Themes</Typography>*/}
      <Themes view={view} />
    </Box>
  }

  return <div className="summarize">
    {renderSummary()}
  </div>
}

// git-blamee for modal