import {useStore} from "../../../data/store";
import React, {useEffect, useCallback} from "react";
import {FullScreenDialog} from "../../Components/Dialog";
import {fmtDate} from "../../../utils/utils";
import {useParams} from "react-router-dom";
import {Loading} from "../../Components/Routing";
const View = React.lazy(() => import("./View"))
const Edit = React.lazy(() => import("./Upsert"))

export function EntriesRouter() {
  const {entry_id, mode} = useParams()
  const setEntryModal = useCallback(useStore(s => s.setEntryModal), [])
  const entries = useStore(s => s.res.entries_list_response?.hash)

  const entry = entry_id && entries?.[entry_id]

  useEffect(() => {
    if (!entry) {return}
    setEntryModal({entry, mode})
  }, [entry_id, mode])

  // rendering handled in Modal.tsx

  if (!entry) {
    return <Loading label="entries_list_response" />
  }

  return null
}


export default function Modal() {
  const entryModal = useStore(s => s.entryModal)
  const setEntryModal = useStore(s => s.setEntryModal)
  const as = useStore(s => s.user?.as)

  const entry = entryModal?.entry
  const mode = as ? "view" : entryModal?.mode

  function onClose() {
    setEntryModal(null)
  }

  function renderContent() {
    if (entry && mode === 'edit') {
      return <Edit entry={entry} onClose={onClose} />
    }
    if (entry && mode === "view") {
      return <View entry={entry} onClose={onClose} />
    }
    return null
  }

  const title = entry ? fmtDate(entry.created_at) : '';

  return <FullScreenDialog
    open={!!entry}
    onClose={onClose}
    title={title}
  >
    {renderContent()}
  </FullScreenDialog>
}
