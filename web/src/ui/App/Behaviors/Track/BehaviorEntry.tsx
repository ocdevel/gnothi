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
import {BehaviorName} from "../BehaviorName.tsx";
import InputAdornment from "@mui/material/InputAdornment";
import {useShallow} from "zustand/react/shallow";
import {create} from "zustand";
import {fields_list_response} from "../../../../../../schemas/fields.ts";
import {iso} from "../../../../data/store/behaviors.ts";
import dayjs from "dayjs";

const useLocalStore = create<{
  sendValue: (fid: string, value: any) => void
  setValue: (fid: string, value: any) => void
  setAndSend: (fid: string, value: any) => void
}>()((set, get) => ({
  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  sendValue: (fid, value) => {
    const {send, behaviors: {isToday, dayStr, setDay}} = useStore.getState()
    // If they interact with a behavior on the start of a new day, without having refreshed
    // the page between yesterday and today, everything gets messed up. Re-set the day, then
    // call this function afterwards. Note: at this point "isToday" is a lie, so it lets us check.
    if (isToday && dayStr !== iso()) {
      setDay(dayjs())
      return setTimeout(() => get().sendValue(fid, value), 100)
    }

    // don't do value?.length, because 0 is a valid value. Later: account for null, which is Fivestar unset().
    // Would need some unsetting logic server-side too
    if (value === null || value === undefined || value === "") {return}
    const req = {
      field_id: fid,
      value: parseFloat(value), // until we support strings,
      day: isToday ? null : dayStr,
    }
    send(`fields_entries_post_request`, req)
  },
  setValue: (fid, value) => {
    const {setValues} = useStore.getState().behaviors
    setValues({[fid]: value})
  },
  setAndSend: (fid, value) => {
    get().setValue(fid, value)
    get().sendValue(fid, value)
  }
}))

interface BehaviorEntry {
  f: fields_list_response & {id: string} // for some reason id not coming in
}
export default function Entry({f}: BehaviorEntry) {
  if (f.type === 'fivestar') {
    return <FiveStarEntry f={f} />
  }
  if (f.type === 'check') {
    return <CheckEntry f={f} />
  }
  return <NumberEntry f={f} />
}

function FiveStarEntry({f}: BehaviorEntry) {
  const value = useStore(s => s.behaviors.values?.[f.id])
  const [changeStar] = useLocalStore(useCallback(s => [
    (event: any, value: number | null) => s.setAndSend(f.id, value)
  ], [f]))

  return <Rating
    className="fivestar"
    value={value || null}
    precision={1 /*0.5*/}
    onChange={changeStar}
  />
}

function NumberEntry({f}: BehaviorEntry) {
  const [
    points,
    value_,
    isToday,
  ] = useStore(useShallow(s => [
    s.user?.me?.points || 0,
    s.behaviors.values?.[f.id],
    s.behaviors.isToday,
  ]))
  const [
    addError
  ] = useStore(useCallback(s => [
    s.addError
  ], []))
  const [setValue, sendValue, setAndSend] = useLocalStore(useCallback(s => [
    s.setValue,
    s.sendValue,
    s.setAndSend
  ], []))

  const value = value_ || 0

  const changeNumber = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    let value = Number(e.target.value)
    if (isNaN(value)) {return}
    setValue(f.id, value)
  }, [f])

  const changeByOne = useCallback((dir: -1 | 1) => () => {
    const val = value + dir
    setAndSend(f.id, val)
  }, [f, value])

  const purchase = useCallback(() => {
    if (f.points > points) {
      return addError(<Box>Not enough points for <BehaviorName name={f.name} /></Box>)
    }
    sendValue(f.id, f.points)
  }, [f.points, points])

  // wrap it so we can wait till blur to send
  const sendValue_ = (e: React.SyntheticEvent<HTMLInputElement>) => {
    sendValue(f.id, value)
  }

  if (f.lane === "reward") {
    return <Button
      variant="outlined"
      sx={{borderRadius:0}}
      onClick={purchase}
    >
      {f.points}
    </Button>
  }

  return <Box sx={{display: 'flex', alignItems: 'center', }}>
    <Button variant="outlined" sx={{borderRadius:0}} onClick={changeByOne(1)}>+</Button>
    <Button variant="outlined" sx={{borderRadius:0}} onClick={changeByOne(-1)}>-</Button>
    <TextField
      disabled={!!f.service && isToday}
      type='number'
      variant="standard"
      step='any'
      onBlur={sendValue_}
      sx={{ml: 2, maxWidth: 90}}
      size="small"
      value={value}
      onChange={changeNumber}
      InputProps={{
        endAdornment: f.reset_quota > 1 ?
          <InputAdornment position="end">/ {f.reset_quota}</InputAdornment>
          : undefined
      }}
    />
  </Box>
}

function CheckEntry({f}: BehaviorEntry) {
  const value = useStore(s => s.behaviors.values?.[f.id])
  const [changeCheck] = useLocalStore(useCallback(s => [
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const val = e.target.checked ? 1 : 0
      s.setAndSend(f.id, val)
    }
  ], [f]))

  return <Checkbox
    defaultChecked
    className="check"
    checked={value === 1}
    onChange={changeCheck}
  />
}