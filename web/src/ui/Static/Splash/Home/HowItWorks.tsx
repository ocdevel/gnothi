import React from "react";
import {Section, Skeleton2} from "./Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import {styled} from '@mui/material/styles';
import Paper from '@mui/material/Paper';

const Item = styled(Paper)(({theme}) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function HowItWorks() {
  return <Section color="dark">
    <CSSGrid/>
  </Section>
};

export function CSSGrid() {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2}>
      <Box gridColumn="span 8">
        <Typography
          variant="h1"
          textAlign='left'
          color="secondary"
        >
          Start a truly life-changing routine
        </Typography>

        <Typography
          variant="body1"
          fontWeight={400}
          textAlign='left'
          mb={2}
          color="secondary"
        >
          Embark on a self-discovery journey with Gnothi—where mindfulness meets AI. Uncover growth areas
          through reflective practices, enriched by AI insights. Your path, brightly lit.
        </Typography>
      </Box>

      <Box gridColumn="span 4">
        <Card variant="outlined" style={{padding: 20, backgroundColor: '#E461DF', marginBottom: '16px'}}>
          <Typography variant="body1" color="textPrimary" gutterBottom align="center">
            Journal
          </Typography>
        </Card>
      </Box>

      <Box gridColumn="span 4">
        <Card variant="outlined" style={{padding: 20, backgroundColor: '#F49D41', marginBottom: '16px'}}>
          <Typography variant="body1" color="textPrimary" gutterBottom align="center">
            Track Behaviors
          </Typography>
        </Card>
      </Box>

      <Box gridColumn="span 8">
        <Card variant="outlined" style={{padding: 20, backgroundColor: '#0097B2', marginBottom: '16px'}}>
          <Typography variant="body1" color="textPrimary" gutterBottom align="center">
            Explore Insights
          </Typography>
        </Card>
      </Box>

      <Box gridColumn="span 8">
        <Card variant="outlined" style={{padding: 20, backgroundColor: '#0097B2', marginBottom: '16px'}}>
          <Typography variant="body1" color="textPrimary" gutterBottom align="center">
            Explore Insights
          </Typography>
        </Card>
      </Box>

      <Box gridColumn="span 8">
        <Card variant="outlined" style={{padding: 20, backgroundColor: '#FA5300', marginBottom: '16px'}}>
          <Typography variant="body1" color="textPrimary" gutterBottom align="center">
            Knowledge Hub
          </Typography>
        </Card>
      </Box>

      <Box gridColumn="span 8">
        <Card variant="outlined" style={{padding: 20, backgroundColor: '#16A637', marginBottom: '16px'}}>
          <Typography variant="body1" color="textPrimary" gutterBottom align="center">
            Choose From Free or Paid Plans
          </Typography>
        </Card>
      </Box>

    </Box>
  );
}

// function InfoBlocks() {
//   return (
//      <Section color="dark">
//         <Typography
//           variant="h1"
//           textAlign='left'
//           color="secondary"
//         >
//           Start a truly life-changing routine
//         </Typography>
//
//         <Typography
//           variant="body1"
//           fontWeight={400}
//           textAlign='left'
//           mb={2}
//           color="secondary"
//         >
//         Embark on a self-discovery journey with Gnothi—where mindfulness meets AI. Uncover growth areas through reflective practices, enriched by AI insights. Your path, brightly lit.
//         </Typography>
//
//       <Card variant="outlined" style={{ padding: 20, backgroundColor: '#E461DF', marginBottom: '16px'}}>
//       <Typography variant="body1" color="textPrimary" gutterBottom align="center">
//         Journal
//       </Typography>
//       </Card>
//
//
//       <Card variant="outlined" style={{ padding: 20, backgroundColor: '#F49D41', marginBottom: '16px' }}>
//       <Typography variant="body1" color="textPrimary" gutterBottom align="center">
//         Track Behaviors
//       </Typography>
//       </Card>
//
//         <Card variant="outlined" style={{ padding: 20, backgroundColor: '#0097B2', marginBottom: '16px' }}>
//         <Typography variant="body1" color="textPrimary" gutterBottom align="center">
//             Explore Insights
//         </Typography>
//         </Card>
//
//         <Card variant="outlined" style={{ padding: 20, backgroundColor: '#FA5300', marginBottom: '16px' }}>
//         <Typography variant="body1" color="textPrimary" gutterBottom align="center">
//             Knowledge Hub
//         </Typography>
//         </Card>
//
//           <Card variant="outlined" style={{ padding: 20, backgroundColor: '#16A637', marginBottom: '16px' }}>
//           <Typography variant="body1" color="textPrimary" gutterBottom align="center">
//             Choose From Free or Paid Plans
//           </Typography>
//         </Card>
//      </Section>
//   );
// }

// export function InfoBlocks({lane}: {lane: "1" | "2" | "3"}) {
//   const headers = {
//     "1": "Journal",
//     "2": "Track",
//     "3": "Explore",
//   }
//     const descriptions = {
//         "1": "Reflect on your day, your thoughts, and your feelings. Journaling is a powerful tool for self-discovery.",
//         "2": "Track your habits, daily tasks, and to-dos. Gnothi will help you stay on top of your goals.",
//         "3": "Explore AI insights that highlight areas for learning and growth, based on your entries and tracked behaviors.",
//     }
//     const icons = {
//         "1": <AddIcon />,
//         "2": <AddIcon />,
//         "3": <AddIcon />,
//     }
//     return <Box>
//     <Card
//       sx={{backgroundColor: '#ffffff', borderRadius: 2, height: "100%"}}
//     >
//         <CardContent sx={{mx: 1}}>
//             <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2}}>
//             <Typography variant="h4" color="primary" fontWeight={500}>{headers[lane]}</Typography>
//             </Box>
//             <Typography variant="body1" color="secondary" fontWeight={400} mb={2}>{descriptions[lane]}</Typography>
//             <Stack direction="row" spacing={2}>
//             <Button variant="outlined" color="primary" size="large" startIcon={icons[lane]}></Button>
//             </Stack>
//         </CardContent>
//     </Card>
//
//     <Masonry columns={{xs: 1, sm: 2, lg: 4}} spacing={2}>
//       <InfoBlocks lane="1"/>
//       <InfoBlocks lane="2"/>
//       <InfoBlocks lane="3"/>
//     </Masonry>
//     </Box>
//     };

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
    <video style={classes.video} loop controls autoPlay controlsList="nodownload" plabackRate={2} muted={true}>
      <source src="https://gnothi-public.s3.amazonaws.com/SplashVideo+(1).mp4" type="video/mp4"/>
    </video>
  </Box>
};


const {spacing, colors, sx} = styles


// <VideoComponent />

//<Typography
//  variant="h4"
//  fontWeight={500}
//  textAlign='left'
//  mb={2}
//  color="secondary"

//>
//  Journal • Track behaviors • Explore AI insights
//</Typography>


//<Typography
//  variant="body1"
//  textAlign='left'
//  mb={2}
//  color="secondary"
//>
//  Practices like meditation, journaling, and self-reflection, along with healthy living, are proven to be beneficial for our well-being.

//</Typography>
//<Typography
//  variant="body1"
//  textAlign='left'
//  mb={2}
//  color="secondary"
//>
//  Gnothi integrates these practices with AI-generated insights to highlight areas for learning and growth, based on your entries and tracked behaviors. It's your journey—Gnothi is just along for the ride.

//</Typography>
//<Typography
//  variant="body1"
//  textAlign='left'
//  mb={2}
//  color="secondary"
//>
// While Gnothi isn't a replacement for therapy in any way, many have found immense value in it. We invite you to try it out and see the difference yourself.
//</Typography>

// Nearly everyone would agree that practices like meditation, journaling, and self-reflection are
// associated with incredible health benefits. Similarly, we all know the importance of eating well,
// exercising, and meeting our needs in healthy ways.
//
// Gnothi was designed to combine journaling and behavior tracking with AI-powered insights that help you narrow your focus. They highlight the aspects
// of your life where there are opportunities for learning and growth, and then you decide where to go from there.
//
// It’s not a replacement for therapy or medical advice by any means, as experts agree that AI isn’t quite
// ready for that. Still, there are thousands of individuals that have found value in it, and we hope yo do too.
