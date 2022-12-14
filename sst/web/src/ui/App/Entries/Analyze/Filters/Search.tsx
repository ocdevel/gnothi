import React, {useCallback, useState, ChangeEventHandler} from "react";
import debounce from "lodash/debounce";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import Box from "@mui/material/Box";
import {useStore} from "../../../../../data/store";

/**
 * Entries() is expensive, so isolate <Search /> and only update the Entries.search
 * periodically (debounce)
 */
export default function Search() {
  // TODO use zodResolver for better performance

  const setFilters = useStore(s => s.setFilters)
  let [search, setSearch] = useState('')

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
    <TextField
      placeholder="Search entries"
      fullWidth
      margin="normal"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      variant="standard"
      value={search}
      onChange={changeSearch}
    />
  </>
}
