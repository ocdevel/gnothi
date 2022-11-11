import {useStore} from "../../../data/store";
import React from "react";
import {FullScreenDialog} from "../../Components/Dialog";
import {fmtDate} from "../../../utils/utils";
const View = React.lazy(() => import("./View"))
const Edit = React.lazy(() => import("./Upsert"))


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
