import {useStore} from "../../../../data/store";
import Button from "@mui/material/Button";
import {ToolbarHeader} from "../../../Components/Misc";
import React from "react";

export default function Toolbar() {
  const setEe = useStore(actions => actions.setEe)
  function onClick() {
    setEe('toolbar_groups_create', true)
  }
  const buttons = <>
    <Button variant='contained' color='info' onClick={onClick}>Create Group</Button>
  </>
  return <ToolbarHeader title='Groups' buttons={buttons}/>
}
