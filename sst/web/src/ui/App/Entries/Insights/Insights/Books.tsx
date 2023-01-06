import React, {useState, useEffect, useCallback} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"
import RecommendIcon from '@mui/icons-material/Recommend';

import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import {LinearProgress} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import {insights_books_response} from '@gnothi/schemas/insights'
import {Insight} from './Utils'

export default function Summarize({view}: Insight) {
  const submitted = useStore(useCallback(s => !!s.res.insights_get_response?.hash?.[view], [view]))
  const books = useStore(useCallback(s => s.res.insights_books_response?.hash?.[view]?.books, [view]))

  const waiting = !books?.length && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <LinearProgress />
  }

  function renderBook(b: insights_books_response['books'][number]) {
    return <Stack direction="column" mb={2}>
      <Typography>{b.name}</Typography>
      <Stack spacing={1} direction="row">
        <RecommendIcon {...icons} />
        <RecommendIcon {...icons} sx={{
          transform: "rotate(180deg)"
        }}/>
      </Stack>
    </Stack>
  }

  const icons = {color: "secondary", fontSize: "large"} as const
  if (!books?.length) {return null}
  return <Box>
    {books.slice(0,5).map(renderBook)}
  </Box>
}
