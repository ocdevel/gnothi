import React from 'react'
import {useStore} from '../../../../data/store'
import Error from '../../../../ui/Components/Error'
import Stack from "@mui/material/Stack";
import {styles} from '../../../Setup/Mui'
import Hero_Features from './Hero_Features';
import MachineLearning from './MachineLearning';
const {spacing, colors, sx} = styles

export default function Features() {
  const error = useStore(state => state.apiError)

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    <Hero_Features/>
    <MachineLearning/>
  </Stack>
}