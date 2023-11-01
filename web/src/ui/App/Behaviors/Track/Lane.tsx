import React, {useEffect, useState, useCallback, useMemo} from "react";
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
import Behavior from './Behavior.tsx'
import Stack from "@mui/material/Stack";
import CardActions from "@mui/material/CardActions";
import AddIcon from '@mui/icons-material/AddCircleOutline';



import HelpHabits from './Help/Habits.mdx'
import HelpDailies from './Help/Dailies.mdx'
import HelpTodos from './Help/Todos.mdx'
import HelpCustom from './Help/Custom.mdx'
import HelpRewards from './Help/Rewards.mdx'
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import {fields_list_response} from "../../../../../../schemas/fields.ts";
import {Sortable} from '../../../Components/Sortable.tsx'
import {useDebounce, useDebouncedCallback} from "use-debounce";
import ButtonGroup from "@mui/material/ButtonGroup";
import produce from "immer";

const headers = {
  habit: "Habits",
  daily: "Dailies",
  todo: "To-Dos",
  custom: "Data",
  reward: "Rewards"
}

const abouts = {
  habit: <HelpHabits />,
  daily: <HelpDailies />,
  todo: <HelpTodos />,
  custom: <HelpCustom />,
  reward: <HelpRewards />
}


interface Behaviors {
  lane: "habit" | "daily" | "todo" | "custom" | "reward"
}

export default function Behaviors({lane}: Behaviors) {
  const allActiveKey = `${lane}_all`
  const [
    // user,
    allActive,
    fields,
  ] = useStore(s => [
    // s.user,
    (s.user?.me?.[allActiveKey] || ["habit", "reward"].includes(lane)),
    s.res.fields_list_response,
  ], shallow)
  const [
    send,
    setView
  ] = useStore(useCallback(s => [
    s.send,
    s.behaviors.setView
  ], []))
  const [sorted, setSorted_] = useState([])
  const setSorted = useDebouncedCallback((sorted) => setSorted_(sorted), 500 , {trailing: true, leading: false})

  // const {as, viewer, me} = user

  useEffect(() => {
    // set secondary sort on .sort?
    // actually nevermind, since server sends it sorted via SQL
    const laneFields = (fields?.rows || [])
      .filter(f => f.lane === lane || (lane === "custom" && !f.lane))
      // .slice().sort((a, b) => (a.sort - b.sort))
    setSorted(laneFields)

  }, [fields?.rows])

  const onReorder = useCallback((newOrder: fields_list_response[]) => {
    setSorted_(newOrder)
    send("fields_sort_request", newOrder.map((f, i) => ({id: f.id, sort: i})))
  }, [])

  // see 3b92a768 for dynamic field groups. Revisit when more than one service. currently just habitica
  // git-blame: now removing Habitica, too unstable. Removing services for now, since adding habit-tracking to gnothi
  // see 186dc090: full gut of this file. May need to refer back to language, help, and functionality

  const onClick = useCallback(() => {
    setView({view: "new", fid: lane})
  }, [lane])

  function renderBehavior(f: fields_list_response) {
    return <Behavior key={f.id} fid={f.id} />
  }

  const toggleAll = useCallback((val: boolean) => () => {
    // do this first real fast, so the UI gets updated quickly; new response will come from the server
    useStore.setState(produce(state => {
      state.user.me[allActiveKey] = val
    }))
    send("users_put_request", {[allActiveKey]: val})
  }, [allActiveKey])

  const allToggle = useMemo(() => {
    if (["habit", "reward"].includes(lane)) { return null }
    return <ButtonGroup size="small">
      <Button
        onClick={toggleAll(false)}
        variant={allActive ? "outlined" : "contained"}
      >
        Active
      </Button>
      <Button
        onClick={toggleAll(true)}
        variant={allActive ? "contained" : "outlined"}
      >
        All
      </Button>
    </ButtonGroup>
  }, [allActive])

  const sortable = useMemo(() => {
    // Currently not allowing sorting unless all items visible. TODO revisit this
    if (!allActive) {
      return sorted.map(renderBehavior)
    }
    return <Sortable
      items={sorted}
      render={renderBehavior}
      onReorder={onReorder}
      sortableId={`sortable-${lane}`}
    />
  }, [sorted, allActive])

  if (fields?.res?.error && fields.res.code === 403) {
    return <h5>{fields.res.data[0].error}</h5>
  }

  return <div className="list">
    <Card
      sx={{backgroundColor: '#ffffff', borderRadius: 2, height: "100%"}}
    >
      <CardContent sx={{mx: 1}}>
        <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2}}>
          <Typography variant="h4" color="primary" fontWeight={500}>{headers[lane]}</Typography>

          {allToggle}

          <IconButton
            aria-label="add"
            variant="contained"
            onClick={onClick}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Box>

        { !sorted.length ? abouts[lane] : sortable }
      </CardContent>
    </Card>
  </div>
}
