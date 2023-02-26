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

import { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

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
      placeholder="Search keywords and phrases, or ask a question"
      inputProps={{ 'aria-label': 'Search keywords and phrases, or ask a question' }}
    />
    {/*<IconButton type="button" sx={{ p: '10px' }} aria-label="search">
      <SearchIcon />
    </IconButton>*/}
    {/*<Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />*/}
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
    >
      {/*<CalendarIcon />*/}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Start"
          inputFormat="YYYY-MM-DD"
          value={filters.startDate}
          onChange={(startDate) => {
            setFilters({startDate});
          }}
          disableFuture
          renderInput={(params) => {
            console.log(params)
            return <TextField
              {...params}
              size="small"
              sx={{maxWidth:150}}
              variant="standard"
              placeholder={undefined}
              InputProps={{
                ...params.InputProps,
                disableUnderline: true
              }}
            />
          }}
        />
        {/*<Typography variant="body1">-</Typography>*/}
        <DatePicker
          label="End"
          inputFormat="YYYY-MM-DD"
          value={filters.endDate === "now" ? undefined : filters.endDate}
          onChange={(endDate) => {
            setFilters({endDate});
          }}
          disableFuture
          renderInput={(params) => <TextField
            {...params}
            size="small"
            sx={{maxWidth:150}}
            variant="standard"
            placeholder={undefined}
            InputProps={{
                ...params.InputProps,
                disableUnderline: true
              }}
          />}
        />
      </LocalizationProvider>
    </Stack>
  </Paper>
  </>
}
