import React, {useEffect} from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import NotesNotifs from "./Notifs";
import {useStore} from "../../../../data/store";
import shallow from "zustand/shallow";
import {EntriesMessages} from "../../Chat/Messages";

interface ListOld {
  entry_id: string
}


/**
 * To be removed, after assessing if containing useful code
 */
export function Entry({entry_id}: ListOld) {
  const [send, notes] = useStore(s => [
    s.send,
    s.res.entries_notes_list_response?.hash?.[entry_id] // {rows, (ids, hash), first}
  ], shallow)

  useEffect(() => {
    if (!entry_id) {return}
    send('entries_notes_list_request', {entry_id})
  }, [entry_id])

  if (!notes?.length) {return null}

  return <div style={{marginTop: '1rem'}}>
    <NotesNotifs entry_id={entry_id} />
    {notes.map(n => <Card className='mb-3' key={n.id}>
      <CardContent>
        <Chip variant="outlined" label={n.type} />{' '}
        {n.private ? "[private] " : null}
        {n.text}
      </CardContent>
    </Card>)}
  </div>
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
      <Chip variant="primary" label={n.type} />
      {n.private ? "[private] " : null}
      {n.text}
      <hr/>
    </>
  }

  return <>
    <h5>Notes</h5>
    {ids.map(renderNote)}
  </>
}

// export const Entry = EntriesMessages
