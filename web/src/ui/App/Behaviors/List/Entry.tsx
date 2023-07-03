import {useStore} from "../../../../data/store";
import {shallow} from "zustand/shallow";
import React, {useCallback, useEffect} from "react";
import _ from "lodash";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import * as S from "@gnothi/schemas";
import Rating from '@mui/material/Rating';
import {useDebouncedCallback} from 'use-debounce';

interface Entry {
  f: S.Fields.fields_list_response
}
export default function Entry({f}: Entry) {
  const [
    value,
    dayStr,
    isToday,
  ] = useStore(s => [
    s.behaviors.values?.[f.id],
    s.behaviors.dayStr,
    s.behaviors.isToday,
  ], shallow)
  const [send, setValues] = useStore(useCallback(s => [s.send, s.behaviors.setValues], []))

  const fid = f.id

  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  const postFieldVal = useCallback((value: any) => {
    // don't do value?.length, because 0 is a valid value. Later: account for null, which is Fivestar unset().
    // Would need some unsetting logic server-side too
    if (value === null || value === undefined || value === "") {return}
    const req = {
      field_id: fid,
      value: parseFloat(value), // until we support strings,
      day: isToday ? null : dayStr
    }
    console.log(req)
    send(`fields_entries_post_request`, req)
  }, [])

  const changeStar = useCallback((event: any, value: number | null) => {
    setValues({[fid]: value})
    postFieldVal(value)
  }, [])

  const changeCheck = useCallback((value: number) => (e: React.SyntheticEvent<HTMLInputElement>) => {
    setValues({[fid]: value})
    postFieldVal(value)
  }, [])

  const changeNumber = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    let value = e.target.value
    setValues({[fid]: value})
  }, [])

  const sendNumber = useCallback(() => {
    postFieldVal(value)
  }, [value])


  if (f.type === 'fivestar') return <>
    <Rating
      className="fivestar"
      value={value || null}
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
        checked={value === 1}
        onChange={changeCheck(1)}
      />}
    />
    <FormControlLabel
      className="check-no"
      label={<Typography variant='body2'>No</Typography>}
      control={<Radio
        checked={value === 0}
        size='small'
        onChange={changeCheck(0)}
      />}
    />
  </div>
  return <>
    <TextField
      disabled={!!f.service && isToday}
      type='number'
      step='any'
      onBlur={sendNumber}
      sx={{maxWidth: 120}}
      size="small"
      value={value || 0}
      onChange={changeNumber}
    />
  </>
}
