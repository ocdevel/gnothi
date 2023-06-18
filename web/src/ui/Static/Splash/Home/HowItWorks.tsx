import React from "react";
import {Section, Skeleton2} from "./Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

const VideoComponent = () => {
  const classes = {
    videoContainer: {
      position: 'relative',
      width: "100%",
      aspectRatio: "16/9",
      overflow: 'hidden',
      borderRadius: 3,
    },
    video: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: 'cover',
      playbackRate: 2,
    },
  }

  return <Box sx={classes.videoContainer}>
    <video style={classes.video} loop controls autoPlay controlsList="nodownload" plabackRate={2} muted={true} >
      <source src="https://gnothi-public.s3.amazonaws.com/SplashVideo+(1).mp4" type="video/mp4" />
    </video>
  </Box>
};


const {spacing, colors, sx} = styles


export default function HowItWorks() {
  return <Section color="grey">
    <Box>
      <Grid
        container
        flexDirection='row'
        alignItems="center"
        justifyContent="space-between"
        spacing={5}
        height="100%"

      >
        <Grid item
          xs={12} md={6}
          flexDirection='row'
        >
          <Grid item xs={12}
                alignItems="flex-start"
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

            <Typography
              variant="body1"
              textAlign='left'
              mb={2}
            >
              Practices like meditation, journaling, and self-reflection, along with healthy living, are proven to be beneficial for our well-being.

            </Typography>
            <Typography
              variant="body1"
              textAlign='left'
              mb={2}
            >
              Gnothi integrates these practices with AI-generated insights to highlight areas for learning and growth, based on your entries and tracked behaviors. It's your journey—Gnothi is just along for the ride.

            </Typography>
            <Typography
              variant="body1"
              textAlign='left'
              mb={2}
            >
             While Gnothi isn't a replacement for therapy in any way, many have found immense value in it. We invite you to try it out and see the difference yourself.
            </Typography>
          </Grid>
        </Grid>

        <Grid
          item
          xs={12} md={6}
        >
          <VideoComponent />
        </Grid>
      </Grid>

    </Box>
  </Section>
}

// Nearly everyone would agree that practices like meditation, journaling, and self-reflection are
// associated with incredible health benefits. Similarly, we all know the importance of eating well,
// exercising, and meeting our needs in healthy ways.
//
// Gnothi was designed to combine journaling and behavior tracking with AI-powered insights that help you narrow your focus. They highlight the aspects
// of your life where there are opportunities for learning and growth, and then you decide where to go from there.
//
// It’s not a replacement for therapy or medical advice by any means, as experts agree that AI isn’t quite
// ready for that. Still, there are thousands of individuals that have found value in it, and we hope yo do too.
