import React from "react";
import { Section } from "./Utils";
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
// import Button from '@mui/material/Button';
import { styles } from '../../../Setup/Mui'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import ShareIcon from '@mui/icons-material/Share';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';

// import {Link} from "../../../Components/Link"
import { FeatureIntro2 } from "../Utils";
const { sx } = styles

export default function DiscoverAI() {

  const iconProps = {sx: sx.featureIcon}
  const featureProps = {color: sx.featureIcon.color}

  return <Section color="grey">
    <Grid
      container
      mb={4}
      flexDirection='row'
      justifyContent='center'
      alignItems='flex-start'
      spacing={4}
      maxWidth={2000}

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
          variant="h4"
          textAlign='center'

        >
          Navigate your journey of self-discovery with more clarity and direction
        </Typography>
      </Grid>


      <FeatureIntro2
        {...featureProps}
        icon={<InsightsOutlinedIcon {...iconProps} />}
        title={"Identify themes and patterns"}
      >
        <Typography>
        Narrow your focus with the keywords and concepts that AI sees in your writing.
        </Typography>
      </FeatureIntro2>

      <FeatureIntro2
        {...featureProps}
        icon={<ShareIcon {...iconProps} />}
        title={"Share entries for support"}
      >
        <Typography>
        Create tags to share specific entries with therapists and friends to connect and exchange ideas.
        </Typography>
      </FeatureIntro2>

      <FeatureIntro2
        {...featureProps}
        icon={<FitnessCenterIcon {...iconProps} />}
        title={"Focus on habits and behaviors"}
      >
        <Typography>
        Track things like mood, sleep, exercise, etc. Then, use data from AI to make changes that have you feeling your best.
        </Typography>
      </FeatureIntro2>

      <FeatureIntro2
        {...featureProps}
        icon={<FolderOpenOutlinedIcon {...iconProps} />}
        title={"Chat with Gnothi"}
      >
        <Typography>
        Interactive prompting can also be used to ask questions and get more out of your journaling experience.
        </Typography>
      </FeatureIntro2>

      <FeatureIntro2
        {...featureProps}
        icon={<AutoStoriesOutlinedIcon {...iconProps} />}
        title={"Get connected to resources"}
      >
        <Typography>
        Gnothi gives you book recommendations based on your writing. You can also interact with AI to get more tools.
        </Typography>
      </FeatureIntro2>
    </Grid>

   {/*<Grid item xs={12}>*/}
   {/* <Link.Button*/}
   {/*   variant="contained"*/}
   {/*   sx={{ backgroundColor: 'primary.main', color: colors.white}}*/}
   {/*   to="/features"*/}
   {/* >*/}
   {/*   Explore features and pricing*/}
   {/* </Link.Button>*/}
   {/* </Grid>*/}


  </Section>
}
