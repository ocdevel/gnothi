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
    send,
    value,
    setValues,

    day,
    dayStr,
    isToday,
  ] = useStore(s => [
    s.send,
    s.behaviors.values?.[f.id],
    s.behaviors.setValues,

    s.behaviors.day,
    s.behaviors.dayStr,
    s.behaviors.isToday,
  ], shallow)

  const fid = f.id

  // manual (text) entry should wait a good while for them to finish typing. Otherwise, send immediately
  const waitFor = f.type === "number" ? 1000 : 0

  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  const postFieldVal = useDebouncedCallback(
    (value: any) => {
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
    }, 
    waitFor
  )

  // since we're debouncing, add a few flush() conditions for Number
  // exit modal too fast
  useEffect(() => {return () => postFieldVal.flush()}, [postFieldVal])
  // change day too fast
  useEffect(() => {postFieldVal.flush()}, [day])

  const setValue = useCallback((e: any) => {
    let value = e?.target?.value ?? e
    postFieldVal(value)
    setValues({[fid]: value})
  }, [])

  const changeStar = useCallback((event: any, v: number | null) => {
    setValue(v)
  }, [])

  const changeCheck = useCallback((v: number) => (e: React.SyntheticEvent<HTMLInputElement>) => {
    setValue(v)
  }, [])


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
      sx={{maxWidth: 120}}
      size="small"
      value={value || 0}
      onChange={setValue}
    />
  </>
}
