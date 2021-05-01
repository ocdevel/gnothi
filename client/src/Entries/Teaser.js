import {useStoreState} from "easy-peasy";
import React, {useState} from "react";
import {Divider, ListItem, ListItemText} from "@material-ui/core";
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

  return <>
    <ListItem
      onClick={() => gotoForm(eid)}
      button
    >
      <ListItemText
        primary={`${fmtDate(e.createdAt)} - ${title}`}
        secondary={summary}
      />
      {/*
      {isSummary ? <>
        <div>
          {sentiment}{summary}
        </div>
        {hovered && <div className='text-info'>You're viewing an AI-generated summary of this entry. Click to read the original.</div>}
      </> : <div>
        {sentiment}{summary}
      </div>}
      */}
      <NotesNotifs entry_id={e.id} />
    </ListItem>
    <Divider />
  </>
}
