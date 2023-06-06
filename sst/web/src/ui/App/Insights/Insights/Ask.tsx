import React, {useCallback, useEffect, useState} from "react";
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {useStore} from "@gnothi/web/src/data/store"
import {Insight} from './Utils'
import Alert from "@mui/material/Alert";

export default function Ask({view}: Insight) {
  const answer = useStore(useCallback(s => s.res.insights_ask_response?.hash?.[view], [view]))

  if (!answer?.answer?.length) {
    return null
  }

  return <>
    <Alert sx={{mb: 2}}>
      <Typography variant="h6">Answer</Typography>
      <Typography>{answer.answer}</Typography>
    </Alert>
  </>
}
