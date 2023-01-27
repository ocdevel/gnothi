import React from 'react'
import {useStore} from '../../../../data/store'
import Error from '../../../../ui/Components/Error'
import Stack from "@mui/material/Stack";

import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

import DiscoverAI from './DiscoverAI';
import NewJournal from "./NewJournal";
import Hero from './Hero'
import Demo from './Demo'
import WhatsNext from './WhatsNext'
import SignUp from "./SignUp";
import AboutUs from "./AboutUs";

export default function Layout() {
  const error = useStore(state => state.apiError)

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    <Hero />
    <DiscoverAI />
    <Demo />
    <AboutUs />
    <SignUp />
  </Stack>
}
