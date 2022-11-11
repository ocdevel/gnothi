import {useStore} from "@gnothi/web/src/data/store"
import React, {useState} from "react";

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
  gotoForm: (eid: string | undefined) => void
}
export default function Teaser({eid, gotoForm}: Teaser) {
  const e = useStore(s => s.res.entries_list_response?.hash?.[eid])
  const [hovered, setHovered] = useState(false)
  const onHover = () => setHovered(true)
  const onLeave = () => setHovered(false)

  if (!e) {return null}

  let title = e.title || e.title_summary
  const isSummary = e.text_summary && e.text !== e.text_summary
  const summary = e.text_summary || e.text
  const sentiment = e.sentiment && sent2face(e.sentiment)

  return <Box
    className='entry-teaser'
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    <Card
      square
      onClick={() => gotoForm(eid)}
      variant='elevation'
      raised={hovered}
      sx={{cursor:'pointer', borderColor: 'primary.main', my: 2}}
    >
      <CardContent>
        <Typography variant='h6'>{title}</Typography>
        <Typography color='text.secondary'>{fmtDate(e.created_at)}</Typography>
        <Typography variant='body1' sx={{pt:1}}>
          <div>{sentiment}{summary}</div>
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
