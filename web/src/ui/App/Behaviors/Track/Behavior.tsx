import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import {BehaviorName} from "../BehaviorName.tsx";
import Badge from "@mui/material/Badge";
import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback, useMemo, useState} from "react";
import IconButton from "@mui/material/IconButton";
import SortIcon from "@mui/icons-material/DragIndicatorOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import ViewIcon from "@mui/icons-material/BarChartOutlined";
import Stack from "@mui/material/Stack";
import BehaviorEntry from './BehaviorEntry.tsx'
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {TripleDots} from "../Upsert/TripleDots.tsx";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";

interface Behavior {
  fid: string
  advanced: boolean
  odd?: boolean
}
export default function Item({fid, advanced}: Behavior) {
  // let rowStyle = {width: '100%', margin: 0}

  const [elevation, setElevation] = useState(0)
  const handleMouseOver = useCallback(() => setElevation(3), [])
  const handleMouseOut = useCallback(() => setElevation(0), [])

  const [
    fields,
    setView,
  ] = useStore(s => [
    s.res.fields_list_response,
    s.behaviors.setView
  ], shallow)

  const f = fields?.hash?.[fid]

  const handleEdit = useCallback(() => {
    setView({view: "edit", fid})
  }, [fid])

  if (!f) {return null} // not ready

  const notes = useMemo(() => {
    if (!f.notes) {return null}
    return <Typography variant="body2">
      <ReactMarkdown>{f.notes}</ReactMarkdown>
    </Typography>
  }, [f.notes])

  // TODO make tabs for this, Active | Inactive:
  // 1. Habits (nothing)
  // 2. Dailies - due on that day vs not due
  // 3. Todos - complete or not
  // 4. Data - analyze_enabled=true vs false
  const active = true

  return (
      <Card
        className={`behavior behavior-${f.type}`}
        key={f.id}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        elevation={elevation}
        sx={{
          mb:0.5,
          border:1,
          borderColor:"#eee",
          '&:hover': {
            borderColor: "primary.main",
          },
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
          <BehaviorName name={f.name} />
          {notes}
        </Box>
      </Card>
  )
}
