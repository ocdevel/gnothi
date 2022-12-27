import {useStore} from "../../../data/store";
import React, {useEffect, useCallback} from "react";
import {FullScreenDialog} from "../../Components/Dialog";
import {fmtDate} from "../../../utils/utils";
import {useParams} from "react-router-dom";
import {Loading} from "../../Components/Routing";
const View = React.lazy(() => import("./View"))
const New = React.lazy(() => import("./Upsert/New"))
const Upsert = React.lazy(() => import("./Upsert/Upsert"))


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
      return <Upsert entry={entry} onClose={onClose} />
    }
    if (entry && mode === "view") {
      return <View entry={entry} onClose={onClose} />
    }
    if (mode === "new") {
      return <New onClose={onClose} />
    }
    return null
  }

  const title = entry ? fmtDate(entry.created_at) : "New Entry";

  return <FullScreenDialog
    open={!!entryModal}
    onClose={onClose}
    title={title}
  >
    {renderContent()}
  </FullScreenDialog>
}
