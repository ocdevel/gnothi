import Behaviors from "./List/Lane.tsx";
import React, {useEffect} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Box from "@mui/material/Box";
import DayChanger from "./Modal/DayChanger.tsx";
import Button from "@mui/material/Button";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../data/store";

export function Track() {
  const [
    me,
    send,
    user,
    fields,
    syncRes,

    day,
    dayStr,
    isToday,
    setView,
  ] = useStore(s => [
    s.user?.me,
    s.send,
    s.user,
    s.res.fields_list_response,
    s.res.habitica_sync_response?.res,

    s.behaviors.day,
    s.behaviors.dayStr,
    s.behaviors.isToday,
    s.behaviors.setView
  ], shallow)


  return <Box>
    <Box
      sx={{display: "flex", justifyContent: "space-between", mb: 2}}
    >
      <DayChanger/>
      <Button variant="outlined" disabled sx={{minWidth: 100}}>
        Score: {me?.score}
      </Button>
    </Box>
    <Grid container spacing={2}>
      <Grid xs={12} sm={4} md={3}>
        <Behaviors lane="habit" />
      </Grid>
      <Grid xs={12} sm={4} md={3}>
        <Behaviors lane="daily" />
      </Grid>
      <Grid xs={12} sm={4} md={3}>
        <Behaviors lane="todo" />
      </Grid>
      <Grid xs={12} sm={4} md={3}>
        <Behaviors lane="custom"/>
      </Grid>
    </Grid>

  </Box>
}