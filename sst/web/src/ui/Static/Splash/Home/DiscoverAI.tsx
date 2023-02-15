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
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import { padding } from "@mui/system";
import {Link} from "../../../Components/Link"
import { FeatureIntro } from "../Utils";

const { spacing, colors, sx } = styles

export default function DiscoverAI() {

  const iconProps = {sx: sx.featureIcon}
  const featureProps = {color: sx.featureIcon.color}

  return <Section color="grey">
    <Grid 
      container 
      mb={7}
      flexDirection='row'
      justifyContent='space-between'
      alignItems='center'
      spacing={4}
    >
      <Grid item xs={12} pb={4}
        alignItems="center">
        <Typography
          variant="h2"
          textAlign='center'
        >
          Discover more with AI
        </Typography>

        <Typography
          variant="subtitle1"
          textAlign='center'
          color="#50577A"
        >
          Navigate your journey of self-discovery with more clarity and direction
        </Typography>
      </Grid>

      <FeatureIntro
        {...featureProps}
        icon={<InsightsOutlinedIcon {...iconProps} />}
        title={"Identify themes and patterns"}
      >
        <Typography>
        As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
        </Typography>
      </FeatureIntro>

      <FeatureIntro
        {...featureProps}
        icon={<ShareIcon {...iconProps} />}
        title={"Share entries for support"} 
      >
        <Typography>
        Create tags to share specific entries with therapists and friends to connect and exchange ideas.           
        </Typography>
      </FeatureIntro>

      <FeatureIntro
        {...featureProps}
        icon={<BedtimeOutlinedIcon {...iconProps} />}
        title={"Analyze your dreams"} 
      >
        <Typography>
        Ever wonder what your dreams mean? Plug them into Gnothi, and use interactive prompting to find out.           
        </Typography>
      </FeatureIntro>

      <FeatureIntro
        {...featureProps}
        icon={<FitnessCenterIcon {...iconProps} />}
        title={"Focus on habits and behaviors"} 
      >
        <Typography>
        Track things like mood, sleep, exercise, etc. Then, use data from AI to make changes that have you feeling your best.          
        </Typography>
      </FeatureIntro>

      <FeatureIntro
        {...featureProps}
        icon={<ChatOutlinedIcon {...iconProps} />}
        title={"Chat with Gnothi"}
      >
        <Typography>
        Interactive prompting can also be used to ask questions and get more out of your journaling experience.             
        </Typography>
      </FeatureIntro>
      
      <FeatureIntro
        {...featureProps}
        icon={<AutoStoriesOutlinedIcon {...iconProps} />}
        title={"Get connected to resources"} 
      >
        <Typography>
        Gnothi gives you book recommendations based on your writing. You can also interact with AI to get more tools.           
        </Typography>
      </FeatureIntro>
    </Grid>
    
   <Grid item xs={12}>
    <Link.Button
      variant="contained"
      sx={{ backgroundColor: "primary.main", color: colors.white}}
      to="/features"
    >
      Explore features and pricing
    </Link.Button>
    </Grid>


  </Section>
}
