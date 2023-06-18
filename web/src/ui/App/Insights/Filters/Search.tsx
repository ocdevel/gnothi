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
import dayjs, {Dayjs} from 'dayjs'

const serverFmt = "YYYY-MM-DD" // must always be this way before submitting to the server
const clientFmt = "YYYY-MM-DD" // can make this something else if we want the browser to show differently

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {shallow} from "zustand/shallow";
import {useDebouncedCallback} from "use-debounce";
// import { DateRangePicker } from "@mui/x-date-pickers/DateRangePicker";

function DatePicker2() {
  const [
    filters,
    setFilters,
    send,
    me
  ] = useStore(s => [
    s.filters,
    s.setFilters,
    s.send,
    s.user?.me
  ], shallow)

  const slotProps = {
    textField: {
      size: "small",
      sx: {maxWidth:135},
      variant: "standard",
      // placeholder: undefined,
      InputProps: {disableUnderline: true}
    }
  } as const

  // just change the date
  function changeStartDate(d: Dayjs | null) {
    setFilters({startDate: d?.format(serverFmt) || undefined})
  }

  // change the date, and persist the preference to the user
  function changeStartDateShortcut(d: Dayjs | null) {
    changeStartDate(d)
    if (!d) {return}
    const filter_days = dayjs().diff(d, "day")
    send("users_put_request", {filter_days})
  }

  function changeEndDate(d: Dayjs | null) {
    setFilters({endDate: d?.format(serverFmt) || undefined})
  }

  return <Stack
    direction="row"
    spacing={2}
    alignItems="center"
  >
    {/*<CalendarIcon />*/}
    <DatePicker
      label="Start"
      format={clientFmt}
      value={dayjs(filters.startDate)}
      onChange={changeStartDate}
      disableFuture
      slotProps={{
        ...slotProps,
        shortcuts: {
          subheader: <Typography pl={1} pt={1}>Go back</Typography>,
          onChange: changeStartDateShortcut,
          dense: true,
          items: [{
            label: "1 week",
            getValue: () => dayjs().subtract(1, "week"),
          }, {
            label: "1 month",
            getValue: () => dayjs().subtract(1, "month"),
          }, {
            label: "3 months",
            getValue: () => dayjs().subtract(3, "month")
          }, , {
            label: "6 months",
            getValue: () => dayjs().subtract(6, "month")
          }, {
            label: "1 year",
            getValue: () => dayjs().subtract(1, "year")
          }, {
            label: "All time",
            getValue: () => dayjs("2019-01-01")
          }]
        },
      }}
      slots={{
        // actionBar: () => <Typography p={2}>Choosing a shortcut on the left will make it your default "entries from _"</Typography>
      }}
    />
    {/*<Typography variant="body1">-</Typography>*/}
    <DatePicker
      label="End"
      format={clientFmt}
      value={filters.endDate}
      onChange={changeEndDate}
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
  const setFilters = useStore(useCallback(s => s.setFilters, []))
  const [search, setSearch] = useState('')

  const trigger = useDebouncedCallback((search: string) => {
    setFilters({search})
  }, 1000)

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
