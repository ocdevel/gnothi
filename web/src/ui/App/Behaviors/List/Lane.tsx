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
import AddIcon from '@mui/icons-material/AddCircleOutline';



import HelpHabits from './Help/Habits.mdx'
import HelpDailies from './Help/Dailies.mdx'
import HelpTodos from './Help/Todos.mdx'
import HelpCustom from './Help/Custom.mdx'
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";

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
    user,
    fields,
  ] = useStore(s => [
    s.user,
    s.res.fields_list_response,
  ], shallow)
  const [setView] = useStore(useCallback(s => [s.behaviors.setView], []))

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

  const onClick = useCallback(() => {
    setView({view: "new", fid: lane})
  }, [lane])

  return <div className="list">
    <Card
      sx={{backgroundColor: '#ffffff', borderRadius: 2, height: "100%"}}
    >
      <CardContent sx={{mx: 1}}>
        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2}}>
          <Typography variant="h4" color="primary" fontWeight={500}>{headers[lane]}</Typography>

          <IconButton
            aria-label="add"
            variant="contained"
            onClick={onClick}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Box>
        {
          !laneFields.length ? abouts[lane]
            : laneFields.map(f => <Behavior key={f.id} fid={f.id} advanced={advanced}/>)
        }
      </CardContent>
    </Card>
  </div>
}
