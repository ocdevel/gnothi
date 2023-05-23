import React from 'react'
import {useStore} from '../../../../data/store'
import Error from '../../../../ui/Components/Error'
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

import {styles} from '../../../Setup/Mui'
const {colors} = styles

import DiscoverAI from './DiscoverAI';
import Discover_Simple from './Discover_Simple';
import Hero from './Hero'
import SignUp from "./SignUp";
import HowItWorks from "./HowItWorks";

export default function Home() {
  const error = useStore(state => state.apiError)

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    <Hero />
    {/*<Demo />*/}
    <HowItWorks />
    <Box>
      <Divider color='#50577a' variant="fullWidth" sx={{borderBottomWidth: 3, py: 1 }} />
    </Box>
    <Discover_Simple />
    <SignUp />
  </Stack>
}
