import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import {BehaviorName} from "../BehaviorName.tsx";
import Badge from "@mui/material/Badge";
import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback, useMemo, useState} from "react";
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
import {fields_list_response} from "../../../../../../schemas/fields.ts";
import Tooltip from "@mui/material/Tooltip";

interface Behavior {
  fid: string
  odd?: boolean
}
export default function Item({fid}: Behavior) {
  const f = useStore(s => s.res.fields_list_response?.hash?.[fid], shallow)
  if (!f) {return null}
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

  const notes = useMemo(() => {
    if (!f.notes) {return null}
    return <Typography variant="body2">
      <ReactMarkdown>{f.notes}</ReactMarkdown>
    </Typography>
  }, [f.notes])

  const active = useMemo(() => (
    ["habit","reward"].includes(f.lane) ? true
    : f.lane === "custom" ? f.analyze_enabled
    : f.score_period < f.reset_quota
  ), [f])

  const streak = useMemo(() => {
    if (!f.streak) {return null}
    return <Box sx={{float: "right"}}>
      <Tooltip title="Streak">
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
          {notes}
        </Box>
      </Card>
  )
}
