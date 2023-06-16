import React, {useEffect, useState, useCallback, useMemo} from 'react'
import {MainTags} from "../../Tags/Tags";
import Search from "./Search";
import {useStore} from "../../../../data/store";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from '@mui/material/Grid';
import {shallow} from "zustand/shallow";
import dayjs from 'dayjs'
import {useDebouncedCallback} from "use-debounce";

export default function Filters() {
  const [selectedTags, filters, me] = useStore(s => [
    s.selectedTags,
    s.filters,
    s.user?.me
  ], shallow)
  const send = useStore(useCallback(s => s.send, []))
  const setFilters = useStore(useCallback(s => s.setFilters, []))

  // debounce this so they can click through tags quickly, or other edge-cases so we don't spam the server
  const sendFilters = useDebouncedCallback((filters_: any) => {
    send("entries_list_request", filters_)
  }, 500)

  useEffect(() => {
    // user's tags (end therefore selection) hasn't come in yet, don't fetch entries
    if (!Object.entries(selectedTags)?.length) { return }
    // user isn't available yet, so we don't know if user.filter_days is present. Wait
    if (!me) { return }
    sendFilters({
      ...filters,
      tags: selectedTags
    })
  }, [filters, selectedTags, me])

  // Soon as the user comes through, set their default filter_days preference. Set it to Gnothi's creation date
  // otherwise. For users who haven't set this, it will be that anyway.
  useEffect(() => {
    const startDate = me?.filter_days ? dayjs().subtract(me.filter_days, "day").format("YYYY-MM-DD") : "2019-01-01"
    setFilters({startDate})
  }, [me])

  return useMemo(() => <Box
    paddingTop={0}
    paddingRight={5}
    paddingLeft={5}
  >
    <Grid
      container
      direction="column"
      // alignItems="center"
      marginX={0}
    >
      <Grid
        item
        alignItems="flex-start"
        justifyItems="flex-start"
        marginX={-3}
        sx={{paddingY: 2}}
      >
        <Search/>
      </Grid>
      <Grid
        item
        flexWrap="wrap"
        marginX={-3}
        sx={{paddingTop: 2, paddingBottom: 4}}
      >
        {MainTags}
      </Grid>
    </Grid>
  </Box>, [])
}
