import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import CommentIcon from "@mui/icons-material/Comment";
import React from "react";
import {useStore} from "../../../../data/store";

interface Notifs {
  entry_id: string
}
export default function Notifs({entry_id}: Notifs) {
  const notes = useStore(s => s.res.entries_notes_list_response?.hash?.[entry_id])
  const notifs = useStore(s => s.res.notifs_notes_list_response?.hash?.[entry_id])

  return null
  const nNotes = notes?.length || 0
  const nNotifs = notifs?.length || 0
  if (!(nNotes || nNotifs)) {return null}

  return <>
    <Button
      color={nNotifs ? "primary" : "inherit"}
      startIcon={<Badge badgeContent={nNotifs} color="primary">
        <CommentIcon />
      </Badge>}
    >
      {nNotes}
    </Button>
  </>
}



