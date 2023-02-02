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

export default function Ask({view}: Insight) {
  const answer = useStore(useCallback(s => s.res.insights_ask_response?.hash?.[view], [view]))

  console.log("answer", answer)
  if (!answer?.answer?.length) {
    return null
  }

  return <>
    <Card>
      <CardContent>
        <Typography>{answer.answer}</Typography>
      </CardContent>
    </Card>
  </>
}
