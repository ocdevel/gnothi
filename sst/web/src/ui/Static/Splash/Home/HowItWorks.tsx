import React from "react";
import {Section, Skeleton2} from "./Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

const {spacing, colors, sx} = styles


export default function HowItWorks() {
  return <Section color="grey">
    <Box>
      <Grid
        container
        flexDirection='row'
        alignItems="center"
        justifyContent="flex-start"
        spacing={10}
        maxWidth={{md: 900, lg: 1200, xl: 2500}}

      >
        <Grid
          xs={12} md={7}
          container item
          flexDirection='row'
          alignItems="flex-start"
          justifyContent="flex-start"
          spacing={4}
        >
          <Grid item xs={12}
                alignItems="center"
          >
            <Typography
              variant="h2"
              textAlign='left'
            >
              Start a truly life-changing routine
            </Typography>

            <Typography
              variant="h4"
              textAlign='left'
              mb={2}

            >
              Journal. Track behavior. Explore AI insights.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography
              variant="body1"
              textAlign='left'
              mb={2}
              maxWidth={{lg: 900}}
            >
              Nearly everyone would agree that practices like meditation, journaling, and self-reflection are
              associated with incredible health benefits. Similarly, we all know the importance of eating well,
              exercising, and meeting our needs in healthy ways.
            </Typography>
            <Typography
              variant="body1"
              textAlign='left'
              mb={2}
              maxWidth={{lg: 900}}
            >
              Gnothi was designed to combine journaling and behavior tracking with AI-powered insights that help you narrow your focus. They highlight the aspects
              of your life where there are opportunities for learning and growth, and then you decide where to go from there.
            </Typography>
            <Typography
              variant="body1"
              textAlign='left'
              mb={2}
              maxWidth={{lg: 900}}
            >
              It’s not a replacement for therapy or medical advice by any means, as experts agree that AI isn’t quite
              ready for that. Still, there are thousands of individuals that have found value in it, and we hope you
              do too.
            </Typography>
          </Grid>
        </Grid>

        <Grid
          item
          xs={12} md={5}
          sx={{width: '100%', height: '100%'}}
        >
          <Typography sx={{backgroundColor: 'green'}}>asdflj</Typography>
        </Grid>
      </Grid>

    </Box>
  </Section>
}
