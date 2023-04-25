import {useStore} from "../../../../data/store";
import shallow from "zustand/shallow";
import React from "react";
import _ from "lodash";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import * as S from "@gnothi/schemas";
import Rating from '@mui/material/Rating';

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

  const fid = f.id
  const v = fieldValues[fid]

  // manual (text) entry should wait a good while for them to finish typing. Otherwise, send immediately
  const waitFor = f.type === "number" ? 1000 : 0

  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  // https://www.freecodecamp.org/news/debounce-and-throttle-in-react-with-hooks/
  // TODO should I be using useRef instead of useCallback? (see link)
  const postFieldVal = React.useMemo(() =>
    _.debounce(postFieldVal_, waitFor),
    [day] // re-initialize with day-change
  )

  async function postFieldVal_(value: string) {
    if (value === "") {return}
    send(`fields_entries_post_request`, {
      field_id: fid,
      value: parseFloat(value), // until we support strings,
      day: isToday ? null : dayStr
    })
  }

   const changeFieldVal = (e: any) => {
    let value = e?.target?.value ?? e
    setFieldValues({[fid]: value})
    postFieldVal(value)
  }

  const changeStar = (event: any, newValue: number | null) => {
    changeFieldVal(newValue)
  }

  const changeCheck = (e: React.SyntheticEvent<HTMLInputElement>) => {
    changeFieldVal(~~!fieldValues[fid])
  }

  if (f.type === 'fivestar') return <>
    <Rating
      className="fivestar"
      value={v || 0}
      precision={1 /*0.5*/}
      onChange={changeStar}
    />
  </>
  if (f.type === 'check') return <div>
    <FormControlLabel
      className="check-yes"
      label={<Typography variant='body2'>Yes</Typography>}
      control={<Radio
        size='small'
        checked={v > 0}
        onChange={changeCheck}
      />}
    />
    <FormControlLabel
      className="check-no"
      label={<Typography variant='body2'>No</Typography>}
      control={<Radio
        checked={v < 1}
        size='small'
        onChange={changeCheck}
      />}
    />
  </div>
  return <>
    <TextField
      disabled={!!f.service && isToday}
      type='number'
      size="small"
      value={v || 0}
      onChange={changeFieldVal}
    />
  </>
}
