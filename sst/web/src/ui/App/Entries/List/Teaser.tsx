import {useStore} from "@gnothi/web/src/data/store"
import React, {useState, useEffect, useCallback, useMemo} from "react";

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import {NotesNotifs} from "../Notes";
import Tags from '../../Tags/Tags'
import {
  Sentiment,
  sent2face,
  fmtDate,
} from "@gnothi/web/src/utils/utils"
import {entries_list_response} from "@gnothi/schemas/entries";
import * as S from "@gnothi/schemas"

// Separate loader component to make assuming entry!=null easier to work with
type GoToForm = (eid: string) => void
interface Loader {
  eid: string
  goToForm?: GoToForm
}
export default function Loader({eid, goToForm}: Loader) {
  const entry = useStore(useCallback((s) => s.res.entries_list_response?.hash?.[eid], [eid]))
  if (!entry) {
    return null
  }
  return <Teaser entry={entry} goToForm={goToForm} />
}

interface Teaser {
  entry: entries_list_response
  goToForm?: GoToForm
}
function Teaser({entry, goToForm}: Teaser) {
  const setEntryModal = useStore(s => s.setEntryModal)
  const me = useStore(s => s.user.me)
  const [hovered, setHovered] = useState(false)
  const onHover = useCallback(() => setHovered(true), [])
  const onLeave = useCallback(() => setHovered(false), [])

  // Note: using a lot of useCallback and useMemo optimizations because hover will
  // cause alot of re-renders

  const isSummary = entry.ai_text?.length && entry.text !== entry.ai_text

  const goToEntry = useCallback(
    () => setEntryModal({mode: "view", entry}),
    [entry]
  )

  const title = useMemo(() => {
    return <Typography
      variant='h6'
      className={entry.ai_title ? 'title ai' : 'title'}
    >
      {entry.title || entry.ai_title}
    </Typography>
  }, [entry.ai_title, entry.title])

  const date = useMemo(() => {
    return <Typography
      variant='body2'
      fontWeight={300}
      marginBottom={1}
      className='date'
      color='primary'
    >
      {fmtDate(entry.created_at)}
    </Typography>
  }, [entry.created_at])

  const sentiment = useMemo(() => {
    return entry.ai_sentiment && sent2face(entry.ai_sentiment as Sentiment)
  }, [entry.ai_sentiment])

  const text = useMemo(() => {
    // debugger
    return <span className={isSummary ? "text ai" : "text"}>
      {S.Entries.getText(entry)}
    </span>
  }, [entry.ai_text, entry.text])

  const hoverText = useMemo(() => {
    if (!isSummary) {return null}
    return <Typography 
      variant='caption' 
      fontStyle='italic'
      color='black'
      fontWeight={300}
      marginTop={2}
      sx={{display: hovered ? 'block' : 'none'}}>
      This is an AI-generated summary of this entry. Click to read the original.
    </Typography>
  }, [hovered, isSummary])

  return <Box
    className='teaser'
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    <Card
      square
      onClick={goToEntry}
      variant='elevation'
      raised={hovered}
      sx={{cursor:'pointer', backgroundColor: 'white', elevation: 10, borderRadius: 2, mb: 2}}
    >
      <CardContent>
        {date}
        {title}
        <Typography variant="body1" sx={{pt: 1, pb: 2}}>
          {sentiment}
          {text}
          {hoverText}
        </Typography>
        <Tags 
          hideUnselected={true}
          noClick={true}
          noEdit={true} 
          preSelectMain={false} 
          selected={entry.tags}
        />
      </CardContent>
      {/*<CardActions>
        <NotesNotifs entry_id={entry.id} />
      </CardActions>*/}
      
    </Card>
  </Box>
}
