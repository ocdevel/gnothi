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

interface Item {
  fid: string
  advanced: boolean
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
    <Grid
      className={`behavior behavior-${f.type}`}
      container
      sx={{
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
      <Grid item xs={sizes[0]} className='field-name' sx={{cursor: "pointer"}} onClick={handleEdit}>
        <FieldName name={f.name} />
      </Grid>

      <Grid item xs={sizes[1]}>
        <BehaviorEntry f={f} />
      </Grid>

      {advanced && <Grid container item xs={sizes[2]}>
        <Grid item>
          {/*<IconButton
            sx={{cursor: "grab"}}
            onClick={handleSort}
          >
            <SortIcon />
          </IconButton>*/}
          <IconButton onClick={handleEdit} className='btn-edit'>
            <EditIcon />
          </IconButton>
        </Grid>
        <Grid item>
          <Badge
            badgeContent={f.avg && f.avg.toFixed(1)}
            onClick={handleView}
          >
            <IconButton onClick={handleView} className='btn-view'>
              <ViewIcon />
            </IconButton>
          </Badge>
        </Grid>
      </Grid>}
    </Grid>
  )
}
