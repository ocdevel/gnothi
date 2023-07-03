import * as React from 'react';
import Popover_ from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ReactMarkdown from "react-markdown";
import {useStore} from "../../../../data/store";
import {useCallback, useState} from "react";
import CircularProgress from "@mui/material/CircularProgress";

export default function Popover() {
  const premium = useStore(s => s.user?.me?.premium)
  const setPremium = useStore(useCallback(s => s.modals.setPremium,[]))
  const insights_nextentry_response = useStore(s => s.res.insights_nextentry_response?.hash?.['list']?.text)
  const [showSuggested, setShowSuggested] = useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (premium) {
      return setShowSuggested(!showSuggested)
    }
    setPremium(true)
    // setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'suggest-entry-popover' : undefined;

  const loading = premium && !insights_nextentry_response?.length
  const disabled = loading && !showSuggested
  const startIcon = loading ? <CircularProgress size={10} /> : null

  return <>
    <Button
      aria-describedby={id}
      variant="text"
      color="secondary"
      endIcon={startIcon}
      disabled={disabled}
      onClick={handleClick}
    >
      {showSuggested ? "Hide Suggestion" : "See Gnothi's suggested deep-dive"}
    </Button>
    <Popover_
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Typography sx={{p: 2}}>Upgrade to Premium</Typography>
    </Popover_>
    {showSuggested && <Typography variant='body2'>
      <ReactMarkdown>{insights_nextentry_response}</ReactMarkdown>
    </Typography>}
  </>
}