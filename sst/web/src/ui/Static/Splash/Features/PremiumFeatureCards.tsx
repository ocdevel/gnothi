import {Section} from "../Home/Utils";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { FeatureCardSm } from "../Home/Utils";
import { FeatureCard } from "../Home/Utils";

const {spacing, colors, sx} = styles

export function PremiumFeatureCards() {
  return <Grid container
    sx={{
      alignItems:"center",
      justifyContent:"center",
      direction:"row"
    }}>
  
  <FeatureCard
    icon={<ChatOutlinedIcon/>}
    title={"Prompt"}
    >
  </FeatureCard>
  </Grid>
}

// Need to continue building this out and add to FeatureLayout.tsx

// Also need to figure out how to set up custom colors and sizes for icons
