import {fields_list_response} from "../../../../../../schemas/fields.ts";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import React from "react";

export function BehaviorNotes({notes}: {notes: string}) {
  if (!notes?.length) {return null}
  return <Typography variant="body2">
    <ReactMarkdown>{notes}</ReactMarkdown>
  </Typography>
}