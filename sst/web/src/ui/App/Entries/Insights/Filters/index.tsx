import React, {useEffect, useState, useCallback} from 'react'
import {MainTags} from "../../../Tags/Tags";
import Search from "./Search";
import DatePickers from './DatePickers'
import {useStore} from "../../../../../data/store";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

export default function Filters() {
  const selectedTags = useStore(s => s.selectedTags)
  const filters = useStore(s => s.filters)

  return <>
    <Stack
      spacing={2}
      direction="row"
      alignItems="center"
      flexWrap="wrap"
    >
      <DatePickers />
      <Box>{MainTags}</Box>
    </Stack>
    <Box>
      <Search />
    </Box>
  </>
}
