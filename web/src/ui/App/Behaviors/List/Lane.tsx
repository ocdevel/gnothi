import React, {useEffect, useState, useCallback} from "react";
// import {API_URL} from '../redux/ws'
import _ from "lodash";

import {useStore} from "@gnothi/web/src/data/store"

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import * as S from '@gnothi/schemas'
import {shallow} from 'zustand/shallow'
import Behavior from './Item'
import Stack from "@mui/material/Stack";
import CardActions from "@mui/material/CardActions";


import HelpHabits from './Help/Habits.mdx'
import HelpDailies from './Help/Dailies.mdx'
import HelpTodos from './Help/Todos.mdx'
import HelpCustom from './Help/Custom.mdx'
import Button from "@mui/material/Button";

const headers = {
  habit: "Habits",
  daily: "Dailies",
  todo: "To-Dos",
  custom: "Custom"
}

const abouts = {
  habit: <HelpHabits />,
  daily: <HelpDailies />,
  todo: <HelpTodos />,
  custom: <HelpCustom />
}


interface Behaviors {
  lane: "habit" | "daily" | "todo" | "custom"
}

// TODO memoize this component, with some setter just for advanced=true|false. False just
// hides certain elements
export default function Behaviors({lane}: Behaviors) {
  const advanced = true
  const [
    send,
    user,
    fields,
    syncRes,

    day,
    dayStr,
    isToday,
    setView
  ] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response,
    s.res.habitica_sync_response?.res,

    s.behaviors.day,
    s.behaviors.dayStr,
    s.behaviors.isToday,
    s.behaviors.setView
  ], shallow)

  // TODO cache-busting @ 49d212a2
  // ensure no longer needed. Original comment:
  // having lots of trouble refreshing certain things, esp. dupes list after picking. Force it for now

  // see 3b92a768 for dynamic field groups. Revisit when more than one service. currently just habitica
  // git-blame: now removing Habitica, too unstable. Removing services for now, since adding habit-tracking to gnothi
  // see 186dc090: full gut of this file. May need to refer back to language, help, and functionality

  const {as, viewer, me} = user

  if (fields?.res?.error && fields.res.code === 403) {
    return <h5>{fields.res.data[0].error}</h5>
  }

  const laneFields = fields?.rows?.filter(f => (
    f.lane === lane || (lane === "custom" && !f.lane)
  )) || []

  function onClick() {
    setView({view: "new", fid: lane})
  }

  return <div className="list">
    <Card
      sx={{backgroundColor: '#ffffff', borderRadius: 2, height: "100%"}}
    >
      <CardContent sx={{mx: 1}}>
        <Box sx={{display: "flex", justifyContent: "space-between", mb: 2}}>
          <Typography variant="h4" color="primary" fontWeight={500}>{headers[lane]}</Typography>
          <Button variant="contained" size="small" onClick={onClick}>Add</Button>
        </Box>
        {
          !laneFields.length ? abouts[lane]
            : laneFields.map(f => <Behavior key={f.id} fid={f.id} advanced={advanced}/>)
        }
      </CardContent>
    </Card>
  </div>
}
