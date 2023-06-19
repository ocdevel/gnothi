import {useStore} from "../../../data/store";
import React, {useEffect, useCallback, useMemo} from "react";
import {FullScreenDialog} from "../../Components/Dialog";
import {fmtDate} from "../../../utils/utils";
import {useParams} from "react-router-dom";
import {Loading} from "../../Components/Routing";
import View from "./View"
import New from "./Upsert/New"
import Upsert from './Upsert/Upsert'
import DialogContent from "@mui/material/DialogContent";

const get = useStore.getState

function ModalContent() {
  const entryModal = useStore(s => s.modals.entry)
  const as = useStore(s => s.user?.as)

  const onClose = useCallback(() => get().modals.setEntry(null), [])

  const entry = entryModal?.entry
  const mode = as ? "view" : entryModal?.mode
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


export default function Modal() {
  const open = useStore(s => Boolean(s.modals.entry))
  const onClose = useCallback(() => get().modals.setEntry(null), [])

  // const title = entry ? fmtDate(entry.created_at) : "New Entry";
  const title = ""

  return <FullScreenDialog
    className="entries modal"
    open={open}
    onClose={onClose}
    title={title}
  >
    <DialogContent>
      <ModalContent />
    </DialogContent>
  </FullScreenDialog>
}
