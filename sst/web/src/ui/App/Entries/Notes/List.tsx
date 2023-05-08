import React, {useEffect} from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import NotesNotifs from "./Notifs";
import {useStore} from "../../../../data/store";
import shallow from "zustand/shallow";
import NotesCreate from './Create'
import {EntriesMessages} from "../../Chat/Messages";
import * as S from '@gnothi/schemas'
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {fmtDate} from "../../../../utils/utils";
import Box from "@mui/material/Box";
import _ from 'lodash'
import Divider from "@mui/material/Divider";

interface ListOld {
  entry_id: string
}


/**
 * To be removed, after assessing if containing useful code
 */
export function Entry({entry_id}: ListOld) {
  const [
    send,
    notes,
  ] = useStore(s => [
    s.send,
    s.res.entries_notes_list_response?.rows // {rows, (ids, hash), first},
  ], shallow)

  useEffect(() => {
    if (!entry_id) {return}
    send('entries_notes_list_request', {entry_id})
  }, [entry_id])

  const divider = <Divider orientation="vertical" variant="middle" flexItem />


  function renderNote(n: S.Notes.entries_notes_list_response) {
    return <Box className='note' key={n.id}>
        <Stack direction="row" spacing={1}>
          <Typography color="secondary" className='type'>{_.startCase(n.type)}</Typography>
          {divider}
          <Typography color="secondary" className='created_at'>{fmtDate(n.created_at)}</Typography>
          {n.private && <>
            {divider}
            <Typography color="secondary" className='private'>Private</Typography>
          </>}
        </Stack>
      <div className='text'>{n.text}</div>
    </Box>
  }

  return <Stack style={{marginTop: '1rem'}} className="notes list" spacing={2}>
    <NotesNotifs entry_id={entry_id} />
    <Typography variant="subtitle1">Notes</Typography>
    {notes?.map(renderNote)}
    <NotesCreate entry_id={entry_id} />
  </Stack>
}

/**
 * Lists all notes, all together. Useful for dashboard view, or "view all notifications" modal.
 */
export function All() {
  // Not using this currently, but it is imported in the <Dashboard /> - so return null here
  return null
  const [
    as,
    send,
    notes
  ] = useStore(s => [
    s.user.as,
    s.send,
    s.res.entries_notes_list_response
  ], shallow)

  useEffect(() => {
    send('entries_notes_list_request', {})
  }, [as])

  if (!notes?.ids?.length) {return null}
  const {ids, hash} = notes

  function renderNote(id: string) {
    const n = hash[id]
    return <>
      <Chip color="primary" label={n.type} />
      {n.private ? "[private] " : null}
      {n.text}
      <hr/>
    </>
  }

  return <div className="notes list">
    <h5>Notes</h5>
    {ids.map(renderNote)}
  </div>
}

// export const Entry = EntriesMessages
