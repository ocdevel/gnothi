import Grid from "@mui/material/Grid";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import {FaArrowLeft, FaArrowRight, FaRegCalendarAlt} from "react-icons/fa";
import React from "react";
import dayjs from 'dayjs'
import {fmt, iso} from '../../../../data/store/behaviors'
import {useStore} from "../../../../data/store";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function DayChanger() {
  const setDay = useStore(s => s.behaviors.setDay)
  const day = useStore(s => s.behaviors.day)
  const dayStr = useStore(s => s.behaviors.dayStr)
  const isToday = useStore(s => s.behaviors.isToday)

  const changeDay = (dir: 1 | -1) => {
    if (dir === -1 ) {
      setDay(dayjs(day).subtract(1, 'day'))
    } else {
      setDay(dayjs(day).add(1, 'day'))
    }
  }

  return <Grid
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
}
