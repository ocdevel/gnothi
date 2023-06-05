 import {useStore} from "../../../data/store";
import {shallow} from "zustand/shallow";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Behavior from './List/Item.tsx'
 import React from "react";

export default function Dashboard() {
  const [send, user, fields, entries, day, isToday, view, setView] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response,
    s.res.fields_entries_list_response?.hash,
    s.behaviors.day,
    s.behaviors.isToday,
    s.behaviors.view,
    s.behaviors.setView
  ], shallow)

  function showModal() {
    setView({
      page: "modal",
      view: "overall",
      fid: null
    })
  }

  function renderEmpty() {
    return <Box>
      <Typography>You have no behaviors to track</Typography>
    </Box>
  }

  function renderList() {
    return <>
      {fields?.ids?.map(fid => <Behavior key={fid} fid={fid}/>)}
    </>
  }

  return <div className="dashboard">
    {fields?.ids?.length ? renderList() : renderEmpty()}
    {/*<Button
      className="btn-expand"
      variant="contained"
      onClick={showModal}
    >
      Dive Deeper
    </Button>*/}
  </div>
}
