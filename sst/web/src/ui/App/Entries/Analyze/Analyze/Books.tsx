import React, {useState, useEffect} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"

import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function Summarize() {
  const submitted = useStore(s => !!s.res.analyze_get_response?.first)
  const books = useStore(s => s.res.analyze_books_response)

  const waiting = !books?.first && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <CircularProgress />
  }

  if (!books?.first) {
    return <Typography>No books, try adjusting filters</Typography>
  }

  return <Box>
    {books.rows.map(b => <Box>
        {b.name}<br/>
        {b.content}
    </Box>)}
  </Box>
}
