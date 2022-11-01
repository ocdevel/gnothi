import {useStoreState} from "easy-peasy";
import React, {useState} from "react";

import Box from '@material-ui/core/Box'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import {NotesNotifs} from "./Notes";
import {
  sent2face,
  fmtDate,
} from "../Helpers/utils"

export default function Teaser({eid, gotoForm}) {
  const e = useStoreState(s => s.ws.data['entries/entries/get'].obj?.[eid])
  const [hovered, setHovered] = useState(false)
  const onHover = () => setHovered(true)
  const onLeave = () => setHovered(false)

  if (!e) {return null}

  let title = e.title || e.title_summary
  const isSummary = e.text_summary && e.text !== e.text_summary
  const summary = e.text_summary || e.text
  const sentiment = e.sentiment && sent2face(e.sentiment)

  return <Box
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
        <Typography color='text.secondary'>{fmtDate(e.createdAt)}</Typography>
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
