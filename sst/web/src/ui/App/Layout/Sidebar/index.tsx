import React, { useState, useEffect } from 'react'
import {
  NavLink as Link,
} from "react-router-dom";

import {useStore} from "../../../../data/store"
import Divider from "@mui/material/Divider";
import Footer from "../../../Footer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {Journal} from './Journal'
import {Groups} from './Groups'
import {Account} from './Account'
import {Misc} from './Misc'

export default function Sidebar() {
  return <Stack direction='column' justifyContent='space-between' sx={{height: '100%'}}>
    <Box flex={1}>
      <Journal />
      <Divider />
      <Groups />
      <Divider />
      <Account />
      <Divider />
      <Misc />
    </Box>
    <Footer />
  </Stack>
}
