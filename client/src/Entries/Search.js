import React, {useCallback, useState} from "react";
import _ from "lodash";
import {Search as SearchIcon} from "@material-ui/icons";
import {TextField, InputAdornment, Box} from "@material-ui/core"

/**
 * Entries() is expensive, so isolate <Search /> and only update the Entries.search
 * periodically (debounce)
 */
export default function Search({trigger}) {
  let [search, setSearch] = useState('')

  const trigger_ = useCallback(_.debounce(trigger, 200), [])

  function changeSearch(e) {
    const s = e.target.value.toLowerCase()
    setSearch(s)
    trigger_(s)
  }

  return <div>
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
  </div>
}
