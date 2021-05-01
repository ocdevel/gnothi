import {useStoreState} from "easy-peasy";
import React, {useState} from "react";
import {Box, Card, CardContent, CardHeader, Divider, ListItem, ListItemText, Typography} from "@material-ui/core";
import {NotesNotifs} from "./Notes";
import {
  sent2face,
  fmtDate,
  bsSizes
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
      elevation={hovered ? 10 : 0}
      sx={{cursor:'pointer', borderColor: 'primary.main'}}
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
        <NotesNotifs entry_id={e.id} />
      </CardContent>
    </Card>
    <Divider />
  </Box>
}
