import React from 'react'
import Grid from '@mui/material/Grid'
import {useStore} from "../../../../data/store";
import Upsert from "./Upsert"
import DialogContent from "@mui/material/DialogContent";

export default function New() {
  const setEntryModal = useStore(s => s.modals.setEntry)
  function onClose() {
    // if (window.localStorage.getItem("testing")) { return }
    setEntryModal(null)
  }

  return  <div>
    <Upsert onClose={onClose} />
  </div>
}
