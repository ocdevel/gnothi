import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import {FieldName} from "../utils";
import Badge from "@mui/material/Badge";
import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback} from "react";
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

interface Behavior {
  fid: string
  advanced: boolean
  odd?: boolean
}
export default function Item({fid, advanced}: Behavior) {
  // let rowStyle = {width: '100%', margin: 0}
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
        sx={{mb:1}}
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
        <CardContent
          sx={{
            display: "flex",
            backgroundColor: "white",
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            ...(f.excluded_at ? {
              textDecoration: 'line-through',
              opacity: .5
            } : {})
          }}
        >


        <Box
          className='field-name'
          sx={{cursor: "pointer"}}
          onClick={handleEdit}
        >
          <FieldName name={f.name} />
        </Box>
        </CardContent>
      </Card>
  )
}
