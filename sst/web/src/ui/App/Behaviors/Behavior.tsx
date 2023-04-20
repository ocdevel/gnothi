import Grid from "@mui/material/Grid";
import ButtonBase from "@mui/material/ButtonBase";
import {FieldName} from "./utils";
import Badge from "@mui/material/Badge";
import {useStore} from "../../../data/store";
import shallow from "zustand/shallow";
import ReactStars from "react-stars";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import React, {useCallback} from "react";
import * as S from "@gnothi/schemas";
import _ from 'lodash'
import IconButton from "@mui/material/IconButton";
import SortIcon from "@mui/icons-material/DragIndicatorOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import ViewIcon from "@mui/icons-material/BarChartOutlined";
import Stack from "@mui/material/Stack";

interface Behavior {
  fid: string
}
export function Behavior({fid}: Behavior) {
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
    setView({view: "view", fid})
  }, [fid])

    const handleEdit = useCallback(() => {
    setView({view: "edit", fid})
  }, [fid])

  return (
    <Grid
      className="behavior"
      container
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1,
        ...(f.excluded_at ? {
          textDecoration: 'line-through',
          opacity: .5
        } : {})
      }}
      key={f.id}
    >
      <Grid item xs={5} className='field-name'>
        <ButtonBase
          sx={{width:'100%', justifyContent: 'flex-start'}}
          onClick={() => setView({view: "edit", fid})}
        >
          <FieldName name={f.name}/>
        </ButtonBase>
      </Grid>

      <Grid item xs={5}>
        <BehaviorEntry f={f} />
      </Grid>

      <Grid container item xs={2} justifyContent='flex-end'>
        <Stack direction="row" alignItems="center">
          <IconButton
            sx={{cursor: "grab"}}
            onClick={handleSort}
          >
            <SortIcon />
          </IconButton>
          <IconButton onClick={handleEdit} className='btn-edit'>
            <EditIcon />
          </IconButton>
          <Badge
            badgeContent={f.avg && f.avg.toFixed(1)}
            onClick={handleView}
          >
            <IconButton onClick={handleView} className='btn-view'>
              <ViewIcon />
            </IconButton>
          </Badge>
        </Stack>


      </Grid>
    </Grid>
  )
}

interface BehaviorEntry {
  f: S.Fields.fields_list_response
}
export function BehaviorEntry({f}: BehaviorEntry) {
  const [
    send,
    fieldEntries,
    fieldValues,
    setFieldValues,

    day,
    isToday,
  ] = useStore(s => [
    s.send,
    s.res.fields_entries_list_response?.hash,
    s.behaviors.values,
    s.behaviors.setValue,

    s.behaviors.day,
    s.behaviors.isToday,
  ], shallow)

  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  // https://www.freecodecamp.org/news/debounce-and-throttle-in-react-with-hooks/
  // TODO should I be using useRef instead of useCallback? (see link)
  const postFieldVal = React.useMemo(() =>
    _.debounce(postFieldVal_, 100),
    [day] // re-initialize with day-change
  )

  async function postFieldVal_(fid: string, value: string) {
    if (value === "") {return}
    send(`fields_entries_post_request`, {
      field_id: fid,
      value: parseFloat(value), // until we support strings,
      day: isToday ? undefined : day
    })
  }

   const changeFieldVal = (fid: string, direct=false) => e => {
    let value = direct ? e : e.target.value
    setFieldValues({[fid]: value})
    postFieldVal(fid, value)
  }

  const changeCheck = (fid: string) => (e: React.SyntheticEvent<HTMLInputElement>) => {
    changeFieldVal(fid, true)(~~!fieldValues[fid])
  }

  const v = fieldValues[f.id]
  if (f.type === 'fivestar') return <>
    <ReactStars
      value={v || 0}
      half={false}
      size={25}
      onChange={changeFieldVal(f.id, true)}
    />
  </>
  if (f.type === 'check') return <div>
    <FormControlLabel
      label={<Typography variant='body2'>Yes</Typography>}
      control={<Radio
        size='small'
        checked={v > 0}
        onChange={changeCheck(f.id)}
      />}
    />
    <FormControlLabel
      label={<Typography variant='body2'>No</Typography>}
      control={<Radio
        checked={v < 1}
        size='small'
        onChange={changeCheck(f.id)}
      />}
    />
  </div>
  return <>
    <TextField
      disabled={!!f.service && isToday}
      type='number'
      size="small"
      value={v || 0}
      onChange={changeFieldVal(f.id)}
    />
  </>
}
