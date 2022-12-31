import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import {useStore} from "../../../../../data/store";

// https://mui.com/x/react-date-pickers/getting-started/

// onChange just tells parent to re-trigger fetch
interface DatePickers {
  onChange: () => void
}
export default function DatePickers() {
  const filters = useStore(s => s.filters)
  const setFilters = useStore(s => s.setFilters)

  // const [value, setValue] = React.useState<Dayjs | null>(
  //   dayjs('2014-08-18T21:11:54'),
  // );

  const setStartDate = (startDate: Dayjs | null) => {
    setFilters({startDate})
  }

  const setEndDate = (setEndDate: Dayjs | null) => {
    setFilters({endDate})
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker
        label="Start Date"
        inputFormat="YYYY-MM-DD"
        value={filters.startDate}
        onChange={setStartDate}
        renderInput={(params) => <TextField {...params} />}
        disableFuture
      />
      <DesktopDatePicker
        label="End Date"
        inputFormat="YYYY-MM-DD"
        value={filters.endDate === "now" ? undefined : filters.endDate}
        onChange={setEndDate}
        renderInput={(params) => <TextField {...params} />}
        disableFuture
      />
      {/*<MobileDatePicker
        label="Date mobile"
        inputFormat="MM/DD/YYYY"
        value={value}
        onChange={handleChange}
        renderInput={(params) => <TextField {...params} />}
      />*/}
    </LocalizationProvider>
  );
}
