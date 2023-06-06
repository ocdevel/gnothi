import React, {useCallback, useState, ChangeEventHandler} from "react";
import debounce from "lodash/debounce";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField"
import Box from "@mui/material/Box";
import {useStore} from "../../../../data/store";
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined';
import Stack from "@mui/material/Stack";
import {Typography} from "@mui/material";
import dayjs from 'dayjs'

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { DateRangePicker } from "@mui/x-date-pickers/DateRangePicker";

function DatePicker2() {
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)

  const slotProps = {
    textField: {
      size: "small",
      sx: {maxWidth:135},
      variant: "standard",
      // placeholder: undefined,
      InputProps: {disableUnderline: true}
    }
  }

  return <Stack
    direction="row"
    spacing={2}
    alignItems="center"
  >
    {/*<CalendarIcon />*/}
      <DatePicker
        label="Start"
        format="YYYY-MM-DD"
        value={dayjs(filters.startDate)}
        onChange={(startDate) => {
          setFilters({startDate})
        }}
        disableFuture
        slotProps={slotProps}
      />
      {/*<Typography variant="body1">-</Typography>*/}
      <DatePicker
        label="End"
        format="YYYY-MM-DD"
        value={filters.endDate === "now" ? dayjs() : dayjs(filters.endDate)}
        onChange={(endDate) => {
          setFilters({endDate})
        }}
        disableFuture
        slotProps={slotProps}
      />
  </Stack>
}

/**
 * Entries() is expensive, so isolate <Search /> and only update the Entries.search
 * periodically (debounce)
 */
export default function Search() {
  // TODO use zodResolver for better performance
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)
  const [search, setSearch] = useState('')

  const trigger_ = (search: string) => setFilters({search})
  const trigger = React.useMemo(
    () => debounce(trigger_, 1000),
   []
  )
  // TODO unlisten on unmount https://dmitripavlutin.com/react-throttle-debounce/

  const changeSearch: ChangeEventHandler<HTMLInputElement> = (e) => {
    const search = e.target.value
    setSearch(search)
    trigger(search)
  }
  return <>
  <Paper
    elevation={1}
    component="form"
    sx={{
      px: 2,
      py: 1,
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      backgroundColor: "white",
      borderRadius: 3,
    }}
  >
    <InputBase
      fullWidth
      value={search}
      onChange={changeSearch}
      sx={{ flex: 1 }}
      placeholder="Search keywords and phrases"
      inputProps={{ 'aria-label': 'Search keywords and phrases' }}
    />
    {/*<IconButton type="button" sx={{ p: '10px' }} aria-label="search">
      <SearchIcon />
    </IconButton>*/}
    {/*<Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />*/}
    <DatePicker2 />
  </Paper>
  </>
}
