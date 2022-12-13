import {useStore} from "../../../data/store";
import {Link} from "react-router-dom";
import Button from "@mui/material/Button";
import {ToolbarHeader} from "../../Components/Misc";
import React from "react";

import {styles} from '../../Setup/Mui'

export default function EntriesToolbar() {
  const as = useStore(s => s.user.as)
  const buttons = as ? null : <>
    {/*<Fab variant="extended" size='medium' {...props}>New Entry</Fab>*/}
    <Button
      variant='contained'
      sx={styles.sx.button2}
      component={Link}
      className="toolbar-button"
      to='/j/entry'
    >New Entry</Button>
  </>
  return <ToolbarHeader title='Journal' buttons={buttons}/>
}
