import {useStore} from "../../../data/store";
import {Link} from "react-router-dom";
import Button from "@mui/material/Button";
import {ToolbarHeader} from "../../Components/Misc";
import React from "react";

export default function EntriesToolbar() {
  const as = useStore(s => s.as)
  const props = {component: Link, to: '/j/entry'}
  const buttons = as ? null : <>
    {/*<Fab variant="extended" size='medium' {...props}>New Entry</Fab>*/}
    <Button variant='contained' color='info' {...props}>New Entry</Button>
  </>
  return <ToolbarHeader title='Journal' buttons={buttons}/>
}
