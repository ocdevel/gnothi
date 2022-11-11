import {useStore} from "../../../data/store";
import {Link} from "react-router-dom";
import Button from "@mui/material/Button";
import {ToolbarHeader} from "../../Components/Misc";
import React from "react";

export default function EntriesToolbar() {
  const as = useStore(s => s.as)
  const buttons = as ? null : <>
    {/*<Fab variant="extended" size='medium' {...props}>New Entry</Fab>*/}
    <Button
      variant='contained'
      color='info'
      component={Link}
      className="toolbar-button"
      to='/j/entry'
    >New Entry</Button>
  </>
  return <ToolbarHeader title='Journal' buttons={buttons}/>
}
