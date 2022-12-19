import Grid from "@mui/material/Grid";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import {FaArrowLeft, FaArrowRight, FaRegCalendarAlt} from "react-icons/fa";
import React from "react";
import dayjs from 'dayjs'
import {fmt, iso} from './utils'

type DayChanger = {
  day: string,
  setDay: (day: string) => void,
  isToday: boolean,
}
export default function DayChanger({day, setDay, isToday}: DayChanger) {
  const changeDay = (dir: 1 | -1) => {
    if (dir === -1 ) {
      setDay(dayjs(day).subtract(1, 'day').format(fmt))
    } else {
      setDay(dayjs(day).add(1, 'day').format(fmt))
    }
  }

  return <Grid
    container
    alignItems='center'
    direction='column'
    sx={{mt: 1, mr: 3 }}
  >
    <Grid item>
      <ButtonGroup aria-label="Edit days">
        <Button
          className='border-right-0'
          variant="outline-secondary"
          onClick={() => changeDay(-1)}
        ><FaArrowLeft /></Button>
        <Button variant="outline-dark" disabled className='border-left-0 border-right-0'><FaRegCalendarAlt /></Button>
        <Button
          className='border-left-0'
          variant="outline-secondary"
          onClick={() => changeDay(1)}
          disabled={isToday}
        ><FaArrowRight /></Button>
      </ButtonGroup>
    </Grid>
    <Grid item>{day}</Grid>
  </Grid>
}
