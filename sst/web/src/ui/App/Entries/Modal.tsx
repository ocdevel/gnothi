import {useStore} from "../../../data/store";
import React, {useEffect, useCallback} from "react";
import {FullScreenDialog} from "../../Components/Dialog";
import {fmtDate} from "../../../utils/utils";
import {useParams} from "react-router-dom";
import {Loading} from "../../Components/Routing";
import View from "./View"
import New from "./Upsert/New"
import Upsert from './Upsert/Upsert'
import DialogContent from "@mui/material/DialogContent";


export default function Modal() {
  const entryModal = useStore(s => s.entryModal)
  const setEntryModal = useStore(useCallback(s => s.setEntryModal, []))
  const as = useStore(s => s.user?.as)

  const entry = entryModal?.entry
  const mode = as ? "view" : entryModal?.mode

  const onClose = useCallback(() => setEntryModal(null), [])

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

  // const title = entry ? fmtDate(entry.created_at) : "New Entry";
  const title = ""

  return <FullScreenDialog
    className="entries modal"
    open={!!entryModal}
    onClose={onClose}
    title={title}
  >
    <DialogContent>
      {renderContent()}
    </DialogContent>
  </FullScreenDialog>
}
