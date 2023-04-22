import {useStore} from "../../../../data/store";
import shallow from "zustand/shallow";
import React from "react";
import _ from "lodash";
import ReactStars from "react-stars";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import * as S from "@gnothi/schemas";

interface Entry {
  f: S.Fields.fields_list_response
}
export default function Entry({f}: Entry) {
  const [
    send,
    fieldEntries,
    fieldValues,
    setFieldValues,

    day,
    dayStr,
    isToday,
  ] = useStore(s => [
    s.send,
    s.res.fields_entries_list_response?.hash,
    s.behaviors.values,
    s.behaviors.setValue,

    s.behaviors.day,
    s.behaviors.dayStr,
    s.behaviors.isToday,
  ], shallow)

  const v = fieldValues[f.id]

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
      day: isToday ? null : dayStr
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
