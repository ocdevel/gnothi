import Grid from "@mui/material/Grid";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import {FaArrowLeft, FaArrowRight, FaRegCalendarAlt} from "react-icons/fa";
import React, {useCallback, useEffect} from "react";
import dayjs from 'dayjs'
import {fmt, iso} from '../../../../data/store/behaviors.ts'
import {useStore} from "../../../../data/store";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useShallow} from "zustand/react/shallow";


export default function DayChanger() {
  const [setDay] = useStore(useCallback(s => [
    s.behaviors.setDay
  ], []))
  const [day, dayStr, isToday] = useStore(useShallow(s => [
    s.behaviors.day,
    s.behaviors.dayStr,
    s.behaviors.isToday
  ]))

  const changeDay = useCallback((dir: 1 | -1) => {
    if (dir === -1 ) {
      setDay(dayjs(day).subtract(1, 'day'))
    } else {
      setDay(dayjs(day).add(1, 'day'))
    }
  }, [day])

  // Check every hour if it's a new day but they're still on the same tab
  useEffect(() => {
    const intervalId = setInterval(isNewDay, 60 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  return <>
    <Grid
      container
      direction="row"
      alignItems="center"
      spacing={2}
    >
      <Grid item>
        <ButtonGroup aria-label="Edit days">
          <Button
            className='border-right-0'
            variant="outlined"
            onClick={() => changeDay(-1)}
          >
            <FaArrowLeft />
          </Button>
          <Button
            variant="outlined"
            disabled
            className='border-left-0 border-right-0'
          >
            <FaRegCalendarAlt />
          </Button>
          <Button
            className='border-left-0'
            variant="outlined"
            onClick={() => changeDay(1)}
            disabled={isToday}
          >
            <FaArrowRight />
          </Button>
        </ButtonGroup>
      </Grid>
      <Grid item>
        <Button disabled>{dayStr}</Button>
      </Grid>
    </Grid>
  </>
}

// If they interact with a behavior on the start of a new day, without having refreshed
// the page between yesterday and today, everything gets messed up. Re-set the day. Return
// true if we had to refresh, else false
export function isNewDay(): boolean {
  const {behaviors: {isToday, dayStr, setDay}} = useStore.getState()
  // Note: at this point "isToday" is a lie, so it lets us check.
  const requiresRefresh = isToday && dayStr !== iso()
  if (requiresRefresh) {
    setDay(dayjs())
    return true
  }
  return false
}