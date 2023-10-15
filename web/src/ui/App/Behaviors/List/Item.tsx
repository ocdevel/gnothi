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
import BehaviorEntry from './Entry'
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

interface Item {
  fid: string
  advanced: boolean
  odd?: boolean
}
export default function Item({fid, advanced}: Item) {
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

  const handleView = useCallback(() => {
    setView({page: "modal", view: "view", fid})
  }, [fid])

    const handleEdit = useCallback(() => {
    setView({page: "modal", view: "edit", fid})
  }, [fid])

  const sizes = advanced ? [5, 5, 2] : [6, 6]

  return (
      <Box
        className={`behavior behavior-${f.type}`}
        sx={{
          display: "flex",
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          ...(f.excluded_at ? {
            textDecoration: 'line-through',
            opacity: .5
          } : {})
        }}
        key={f.id}
      >

        <Box
          className='field-name'
          sx={{cursor: "pointer"}}
          onClick={handleView}
        >
          <FieldName name={f.name} />
        </Box>

        <BehaviorEntry f={f} />

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
      </Box>
  )
}
