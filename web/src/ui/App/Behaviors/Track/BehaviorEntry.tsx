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
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import {FieldName} from "../utils.tsx";

interface BehaviorEntry {
  f: S.Fields.fields_list_response
}
type Value = number | null
type EntryVariant = BehaviorEntry & {
  value: number
  setValue: (value: Value) => void
  sendValue: (value: Value) => void
  isToday: boolean
}
export default function Entry({f}: BehaviorEntry) {
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
  const sendValue = useCallback((value: any) => {
    // don't do value?.length, because 0 is a valid value. Later: account for null, which is Fivestar unset().
    // Would need some unsetting logic server-side too
    if (value === null || value === undefined || value === "") {return}
    const req = {
      field_id: fid,
      value: parseFloat(value), // until we support strings,
      day: isToday ? null : dayStr,
    }
    console.log(req)
    send(`fields_entries_post_request`, req)
  }, [])

  const setValue = useCallback((value: Value) => {
    setValues({[fid]: value})
  }, [])

  const entryVariantProps = { f, value, setValue, sendValue, isToday }

  if (f.type === 'fivestar') {
    return <FiveStarEntry {...entryVariantProps} />
  }

  if (f.type === 'check') {
    return <CheckEntry {...entryVariantProps} />
  }
  return <NumberEntry {...entryVariantProps} />
}

function FiveStarEntry({f, value, setValue, sendValue, isToday}: EntryVariant) {
  const changeStar = useCallback((event: any, value: number | null) => {
    setValue(value)
    sendValue(value)
  }, [])

  return <Rating
    className="fivestar"
    value={value || null}
    precision={1 /*0.5*/}
    onChange={changeStar}
  />
}

function NumberEntry({f, value, setValue, sendValue, isToday}: EntryVariant) {
  const [
    score,
  ] = useStore(s => [
    s.user?.me?.score || 0
  ], shallow)
  const [
    addError
  ] = useStore(useCallback(s => [
    s.addError
  ], []))

  value = value || 0
  const changeNumber = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    let value = Number(e.target.value)
    if (isNaN(value)) {return}
    setValue(value)
  }, [])

  const changeByOne = useCallback((dir: -1 | 1) => () => {
    const val = value + dir
    setValue(val)
    sendValue(val)
  }, [value])

  const purchase = useCallback(() => {
    if (f.value > score) {
      return addError(<Box>Not enough points for <FieldName name={f.name} /></Box>)
    }
    sendValue(f.value)
  }, [value, score])

  // wrap it so we can wait till blur to send
  const sendValue_ = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    sendValue(value)
  }, [value])

  if (f.lane === "reward") {
    return <Button
      variant="outlined"
      sx={{borderRadius:0}}
      onClick={purchase}
    >
      {f.value}
    </Button>
  }

  return <Box sx={{display: 'flex', alignItems: 'center'}}>
    <Button variant="outlined" sx={{borderRadius:0}} onClick={changeByOne(-1)}>-</Button>
    <Button variant="outlined" sx={{borderRadius:0}} onClick={changeByOne(1)}>+</Button>
    <TextField
      disabled={!!f.service && isToday}
      type='number'
      variant="standard"
      step='any'
      onBlur={sendValue_}
      sx={{ml: 2, maxWidth: 100}}
      size="small"
      value={value}
      onChange={changeNumber}
    />
  </Box>
}

function CheckEntry({f, value, setValue, sendValue, isToday}: EntryVariant) {
  const changeCheck = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const val = e.target.checked ? 1 : 0
    setValue(val)
    sendValue(val)
  }, [])

  return <Checkbox
    defaultChecked
    className="check"
    checked={value === 1}
    onChange={changeCheck}
  />
}