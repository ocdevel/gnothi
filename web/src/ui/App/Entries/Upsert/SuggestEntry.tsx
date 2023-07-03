import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ReactMarkdown from "react-markdown";
import {useStore} from "../../../../data/store";
import {useCallback, useState} from "react";
import CircularProgress from "@mui/material/CircularProgress";

export default function SuggestEntry() {
  const premium = useStore(s => s.user?.me?.premium)
  const setPremium = useStore(useCallback(s => s.modals.setPremium,[]))
  const insights_nextentry_response = useStore(s => s.res.insights_nextentry_response?.hash?.['list']?.text)
  const [showSuggested, setShowSuggested] = useState(false)

  // git-blame for popover

  function handleClick () {
    if (premium) {
      return setShowSuggested(!showSuggested)
    }
    setPremium(true)
  }

  const loading = premium && !insights_nextentry_response?.length
  const disabled = loading && !showSuggested
  const startIcon = loading ? <CircularProgress size={10} /> : null

  return <>
    <Button
      variant="text"
      color="secondary"
      endIcon={startIcon}
      disabled={disabled}
      onClick={handleClick}
    >
      {showSuggested ? "Hide Suggestion" : "See Gnothi's suggested deep-dive"}
    </Button>
    {showSuggested && <Typography variant='body2'>
      <ReactMarkdown>{insights_nextentry_response}</ReactMarkdown>
    </Typography>}
  </>
}