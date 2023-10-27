import Behaviors from "./Lane.tsx";
import React, {useEffect} from "react";
import Grid from "@mui/material/Unstable_Grid2";
import Box from "@mui/material/Box";
import DayChanger from "./DayChanger.tsx";
import Button from "@mui/material/Button";
import {shallow} from "zustand/shallow";
import {useStore} from "../../../../data/store";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export function Track() {
  const [
    score,
  ] = useStore(s => [
    s.user?.me?.score,
  ], shallow)

  return <Box>
    <Box
      sx={{display: "flex", justifyContent: "space-between", mb: 2}}
    >
      <DayChanger/>
      <Card>
        <CardContent sx={{backgroundColor: "white", minWidth: 170}}>
          Score: {score}
        </CardContent>
      </Card>
    </Box>
    <Grid container spacing={2}>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Behaviors lane="reward"/>
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Behaviors lane="habit" />
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Behaviors lane="daily" />
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Behaviors lane="todo" />
      </Grid>
      <Grid xs={12} sm={6} md={4} lg={3}>
        <Behaviors lane="custom"/>
      </Grid>
    </Grid>
  </Box>
}
