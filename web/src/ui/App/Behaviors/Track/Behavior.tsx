import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import {BehaviorName} from "../BehaviorName.tsx";
import Badge from "@mui/material/Badge";
import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback, useMemo, useRef, useState} from "react";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import FastForwardIcon from '@mui/icons-material/FastForward';
import BehaviorEntry from './BehaviorEntry.tsx'
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {TripleDots} from "../Upsert/TripleDots.tsx";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import {fields_list_response, fields_post_request} from "../../../../../../schemas/fields.ts";
import Tooltip from "@mui/material/Tooltip";
import {Subtasks} from './Subtasks.tsx'
import {BehaviorNotes} from "./BehaviorNotes.tsx";

interface Behavior {
  fid: string
  odd?: boolean
}
export default function Item({fid}: Behavior) {
  const f = useStore(s => s.res.fields_list_response?.hash?.[fid], shallow)
  if (!f) {return null}
  if (f.parent_id) { return null }
  return <Item_ f={f} fid={fid}/>
}
function Item_({f, fid}: {f: fields_list_response, fid: string}) {
  // let rowStyle = {width: '100%', margin: 0}
  const allActiveKey = `${f.lane}_all`
  const [
    timerFid,
    allActive
  ] = useStore(s => [
    s.behaviors.timer.fid,
    (s.user?.me?.[allActiveKey] || ["habit", "reward"].includes(f.lane))
  ], shallow)
  const [setView] = useStore(useCallback(s => [s.behaviors.setView], []))

  const [elevation, setElevation] = useState(0)
  const handleMouseOver = useCallback(() => setElevation(3), [])
  const handleMouseOut = useCallback(() => setElevation(0), [])

  const handleEdit = useCallback(() => {
    setView({view: "edit", fid})
  }, [fid])

  const active = useMemo(() => {
    // habits and rewards are always "due" (aka, no concept of that)
    if (["habit", "reward"].includes(f.lane)) {
      return true
    }
    // Hide Data behaviors which have analyze_disabled. The intent there is "keept his around
    // so as not to delete the data; but I'm no longer interested"
    if (f.lane === "custom") {
      return f.analyze_enabled
    }
    // For dailies, the only complexity is if it's not active for this particular day.
    // Everything else (dailies & todos) are considered due, if they haven't met the quota
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const date = new Date();  // You can pass a specific date string to the Date constructor if needed
    const dayName = days[date.getDay()];
    if (f.lane === "daily" && !f[dayName]) {
      return false
    }
    return f.score_period < f.reset_quota
  }, [f])

  const streak = useMemo(() => {
    if (!f.streak) {return null}
    return <Box sx={{float: "right"}}>
      <Tooltip title="Streak" arrow>
        <Box sx={{display: "flex", alignContent: "center", gap: 0.5}}>
          <FastForwardIcon />
          <span>{f.streak}</span>
        </Box>
      </Tooltip>
    </Box>
  }, [f.streak])

  if (!allActive && !active) {return null}

  const isTiming = timerFid === fid
  const timerExtras = isTiming ? {
    card: {elevation: 20},
    cardSx: {borderColor: "primary.main", borderWidth: 3, mb: 1.5},
  } : {
    card: {}, cardSx: {}, box: {}
  }
  return (
      <Card
        className={`behavior behavior-${f.type}`}
        key={f.id}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        elevation={elevation}
        {...timerExtras.card}
        sx={{
          opacity: active ? 1 : .5,
          mb: 0.5,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#eee",
          '&:hover': {
            borderColor: "primary.main",
          },
          ...timerExtras.cardSx
      }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor:
              f.lane === "reward" ? "#fff"
              : f.score_total < -4 ? "#de3f3f"
              : f.score_total > 4 ? "#3bcad7"
              : "#ffbe5d",
          }}
        >
          <BehaviorEntry f={f} />
          <TripleDots f={f} />
        </Box>
        <Box
          sx={{
            m:0,p:1,
            backgroundColor: "white",
            // ...(f.excluded_at ? {
            //   textDecoration: 'line-through',
            //   opacity: .5
            // } : {})
            cursor: "pointer"
          }}
          className='field-name'
          onClick={handleEdit}
        >
          {streak}
          <BehaviorName name={f.name} />
          <BehaviorNotes notes={f.notes} />
        </Box>
        <Subtasks f={f} />
      </Card>
  )
}
