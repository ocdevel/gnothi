import {useStore} from "@gnothi/web/src/data/store"
import React, {useState, useEffect, useCallback} from "react";

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {NotesNotifs} from "../Notes";
import {
  sent2face,
  fmtDate,
} from "@gnothi/web/src/utils/utils"

interface Teaser {
  eid: string
  gotoForm: (eid: string) => void
}
export default function Teaser({eid, gotoForm}: Teaser) {
  const setEntryModal = useStore(s => s.setEntryModal)
  const entry = useStore(useCallback(s => s.res.entries_list_filtered?.hash?.[eid], [eid]))
  const me = useStore(s => s.user.me)
  const [hovered, setHovered] = useState(false)
  const onHover = () => setHovered(true)
  const onLeave = () => setHovered(false)

  const e = entry?.entry
  if (!e) {return null}
  const {tags} = entry
  let title = e.title || e.ai_title
  const isSummary = e.ai_text && e.text !== e.ai_text
  const summary = e.ai_text || e.text
  const sentiment = e.ai_sentiment && sent2face(e.ai_sentiment)

  function goToEntry() {
    setEntryModal({mode: "view", entry})
  }

  return <Box
    className='entry-teaser'
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    <Card
      square
      onClick={goToEntry}
      variant='elevation'
      raised={hovered}
      sx={{cursor:'pointer', borderColor: 'primary.main', my: 2}}
    >
      <CardContent>
        <Typography variant='h6'>{title}</Typography>
        <Typography color='text.secondary'>{fmtDate(e.created_at)}</Typography>
        <Typography variant='body1' component="div" sx={{pt:1}}>
          <Box>{sentiment}{summary}</Box>
          {isSummary && <Typography variant='caption' sx={{display: hovered ? 'block' : 'none'}}>
            This is an AI-generated summary of this entry. Click to read the original.
          </Typography>}
        </Typography>
      </CardContent>
      <CardActions>
        <NotesNotifs entry_id={e.id} />
      </CardActions>
    </Card>
  </Box>
}
