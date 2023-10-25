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
  if (!f) {return null} // not ready

  const handleSort = useCallback(() => {
    alert("Not implemented")
  }, [fid])


  const handleEdit = useCallback(() => {
    setView({view: "edit", fid})
  }, [fid])

  const sizes = advanced ? [5, 5, 2] : [6, 6]

  return (
      <Card
        className={`behavior behavior-${f.type}`}
        key={f.id}
        sx={{mb:1}}
      >
        <Box
          sx={{
            backgroundColor:
              f.lane === "reward" ? "#fff"
              : f.score_total < -4 ? "#de3f3f"
              : f.score_total > 4 ? "#3bcad7"
              : "#ffbe5d",
          }}
        >
          <BehaviorEntry f={f} />
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

        {false && advanced && <Box
          sx={{
            flex:1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
        }}>
          <Box>
            {/*<IconButton
              sx={{cursor: "grab"}}
              onClick={handleSort}
            >
              <SortIcon />
            </IconButton>*/}
            <IconButton onClick={handleEdit} className='btn-edit'>
              <EditIcon />
            </IconButton>
          </Box>
          <Box>
            <Badge
              badgeContent={f.avg && f.avg.toFixed(1)}
              onClick={handleView}
            >
              <IconButton onClick={handleView} className='btn-view'>
                <ViewIcon />
              </IconButton>
            </Badge>
          </Box>
        </Box>}
        </CardContent>
      </Card>
  )
}
