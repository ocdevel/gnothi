import React, {useState, useEffect} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"
import RecommendIcon from '@mui/icons-material/Recommend';

import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import {LinearProgress} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";

export default function Summarize() {
  const submitted = useStore(s => !!s.res.analyze_get_response?.first)
  const books = useStore(s => s.res.analyze_books_response)

  const waiting = !books?.first && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <LinearProgress />
  }

  const icons = {color: "secondary", fontSize: "large"} as const
  return <Box>
    {books.rows.slice(0,5).map(b => <Stack direction="column" mb={2}>
      <Typography>{b.name}</Typography>
      <Stack spacing={1} direction="row">
        <RecommendIcon {...icons} />
        <RecommendIcon {...icons} sx={{
          transform: "rotate(180deg)"
        }}/>
      </Stack>
    </Stack>)}
  </Box>
}
