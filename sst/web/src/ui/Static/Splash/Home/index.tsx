import React from 'react'
import {useStore} from '../../../../data/store'
import Error from '../../../../ui/Components/Error'
import Stack from "@mui/material/Stack";

import {styles} from '../../../Setup/Mui'
const {colors} = styles

import DiscoverAI from './DiscoverAI';
import Discover_Simple from './Discover_Simple';
import Hero from './Hero'
import SignUp from "./SignUp";
import HowItWorks from "./HowItWorks";

export default function Layout() {
  const error = useStore(state => state.apiError)

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    <Hero />
    <Discover_Simple />
    {/*<Demo />*/}
    <HowItWorks />
    <SignUp />
  </Stack>
}
