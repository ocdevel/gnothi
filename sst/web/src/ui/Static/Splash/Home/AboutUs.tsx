import React from "react";
import { Section, Skeleton2 } from "./Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { styles } from '../../../Setup/Mui'
const { spacing, colors, sx } = styles



export default function DiscoverAI() {
  return <Section color="grey">
    <Grid
      container
      flexDirection='row'
      alignItems="center"
      justifyContent="center"
      spacing={4}
    >
      <Grid item xs={12}>
        <Typography
          variant="h2"
          textAlign='center'
        >
          Experience a new kind of journal
        </Typography>

        <Typography
          variant="h4"
          maxWidth={900}
          textAlign='center'
        >
          The perfect combination of tech and soul
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack
          direction="column"
          alignItems="flex-start"
          justifyContent="flex-start"
          spacing={4}
        >
          <Typography
            maxWidth={550}
            variant="body1"
            textAlign='left'
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </Typography>

          <Typography
            maxWidth={550}
            variant="body1"
            textAlign='left'
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </Typography>
        </Stack>
      </Grid>

      <Grid item xs={12} md={6}>
        <Skeleton2 />
      </Grid>

    </Grid>
  </Section>
}
