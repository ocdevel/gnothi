import React from "react";
import { Section, Skeleton2 } from "./Utils";
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from '@mui/material/Button';
import { styles } from '../../../Setup/Mui'
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import ShareIcon from '@mui/icons-material/Share';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { padding } from "@mui/system";
const { spacing, colors, sx } = styles


type FeatureIntro = {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

export function FeatureIntro({ icon, title, children }: FeatureIntro){
  return <Stack
    direction="row"
    alignItems="flex-start"
    justifyContent="flex-end"
    spacing={2}
    >
    {icon}  
    <div>
      <Typography 
      variant='h6' 
      color='#50627a'
      marginBottom={1}>{title}
      </Typography>

      <Typography 
      variant="body1"
      >{children}</Typography>
    </div>
  </Stack>
}
export default function DiscoverAI() {
  return <Section color="grey">

    <Stack
      direction='column'
      sx={{ 
      paddingBottom: 2,
      display: 'flex', 
      justifyItems: "center", 
      alignItems: "center"}}
      >
      <Typography
        variant="h2"
        textAlign='center'
      >
        Discover more with AI
      </Typography>

      <Typography
        variant="h4"
        maxWidth={900}
      >
        Navigate your journey of self-discovery with more clarity and direction.
      </Typography>
    </Stack>

    <Grid container 
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyItems: 'flex-start'
      }}
      >

      <Grid item xs={12} md={6}>
        <Stack direction="column" spacing={4}>
          <FeatureIntro
            icon={<InsightsOutlinedIcon sx={sx.featureIcon} />}
            title={"Identify themes and patterns"} 
            >
            <Typography>
            As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
            </Typography>
          </FeatureIntro>

          <FeatureIntro
            icon={<BedtimeOutlinedIcon sx={sx.featureIcon} />}
            title={"Analyze your dreams"} 
            >
            <Typography>
            Ever wonder what your dreams mean? Plug them into Gnothi, and use interactive prompting to find out.           
            </Typography>
          </FeatureIntro>

          <FeatureIntro
            icon={<ShareIcon sx={sx.featureIcon} />}
            title={"Share entries for support"} 
            >
            <Typography>
            Create tags to share specific entries with therapists and friends to connect and exchange ideas.           
            </Typography>
          </FeatureIntro>

          <FeatureIntro
            icon={<FitnessCenterIcon sx={sx.featureIcon} />}
            title={"Focus on habits and behaviors"} 
            >
            <Typography>
            Track things like mood, sleep, exercise, etc. Then, use data from AI to make changes that have you feeling your best.          
            </Typography>
          </FeatureIntro>

          <FeatureIntro
            icon={<AutoStoriesOutlinedIcon sx={sx.featureIcon} />}
            title={"Get connected to resources"} 
            >
            <Typography>
            Gnothi gives you book recommendations based on your writing. You can also interact with AI to get more tools.           
            </Typography>
          </FeatureIntro>
        </Stack>
      </Grid>

      <Grid item xs={12} md={6}>
        <Skeleton2 />
      </Grid>
    </Grid>
    <Button
      variant="contained"
      sx={{ backgroundColor: "primary.main", color: colors.white, marginTop: '1rem' }}
    >
      Explore the features
    </Button>

  </Section>
}
