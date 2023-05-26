import React, {useState, useEffect, useCallback} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"
import RecommendIcon from '@mui/icons-material/Recommend';
import ThumbUpIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDownOutlined';
import BookmarkIcon from '@mui/icons-material/BookmarkAddOutlined';


import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import {LinearProgress} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import {insights_books_response} from '@gnothi/schemas/insights'
import {Insight} from './Utils'
import Divider from "@mui/material/Divider";

export default function Books({view}: Insight) {
  const submitted = useStore(useCallback(s => !!s.res.insights_get_response?.hash?.[view], [view]))
  const books = useStore(useCallback(s => s.res.insights_books_response?.hash?.[view]?.books, [view]))

  const waiting = !books?.length && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <LinearProgress />
  }

  function renderBook(
    b: insights_books_response['books'][number],
    i: number,
  ) {

    return <Stack direction="column" mb={2} key={b.id}>
      <Typography 
        sx={{
          fontStyle: "italic", 
          variant: 'body1', mb: 1
         }}
         >
        {b.name} by {b.author}
         </Typography>

      <Divider/>

      {/*<Stack spacing={1.5} direction="row">*/}
      {/*  <ThumbUpIcon sx={{color:"primary.main"}}*/}
      {/*    />*/}
      {/*  <ThumbDownIcon sx={{mt: 2, color:'#7B515C'}}*/}
      {/*  />*/}
      {/*  <BookmarkIcon sx={{color:"#40635A"}}*/}
      {/*  />*/}
      {/*</Stack>*/}
    </Stack>
  }

  const icons = {color: "secondary", fontSize: "large"} as const
  if (!books?.length) {return null}
  return <Box>
    {books.slice(0,6).map(renderBook)}
  </Box>
}
