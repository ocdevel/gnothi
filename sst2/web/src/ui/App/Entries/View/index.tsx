import {useParams} from "react-router-dom";
import {useStore} from "../../../../data/store";
import React from "react";
import Entry from "./Entry";
import {Loading} from '../../../Components/Routing'
import {FullScreenDialog} from "../../../Components/Dialog";

export default function EntryPage() {
  const {entry_id} = useParams()
  const entries = useStore(s => s.res.entries_list_response?.hash)
  if (!entry_id) {
    return <Loading label="entries_list_response" />
  }
  const entry = entries?.[entry_id]
  return <Entry entry={entry} />
}
