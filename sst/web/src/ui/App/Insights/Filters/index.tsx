import React, {useEffect, useState, useCallback} from 'react'
import {MainTags} from "../../Tags/Tags";
import Search from "./Search";
import {useStore} from "../../../../data/store";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from '@mui/material/Grid';

export default function Filters() {
  const selectedTags = useStore(s => s.selectedTags)
  const filters = useStore(s => s.filters)

  return <Box
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
  </Box>
}
