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
        Experience a new kind of journal      
      </Typography>

      <Typography
        variant="h4"
        maxWidth={900}
        textAlign='center'
      >
        The perfect combination of tech and soul      
      </Typography>
    </Stack>

    <Box
      sx={{
        alignContent:"center", 
        }}>

    <Grid container 
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'flex-start',
        alignItems: 'flex-start',
        justifyItems: 'space-between',
        justifyContent: 'space-between',
        mb: 6, 
      }}
      >

      <Grid item xs={12} md={6} 
        sx={{
          alignItems: 'center', 
          alignContent: 'center',
          justifyItems: 'center',
          justifyContent: 'center'}}
          >
          <Stack 
            direction="column" 
            alignItems="center"
            justifyItems="center"
            spacing={4}
            px={4}
            maxWidth={500}
            >
            <Typography
              variant="body1"
              textAlign='left'
            >
              Advances in machine learning may call to mind a future world ruled by robots, but not for the founders of Gnothi. The two psychology and personal development enthusiasts see an opportunity for new technologies to serve a more altruistic purpose.      
            </Typography>

            <Typography
              variant="body1"
              textAlign='left'
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer orci magna, tincidunt id interdum sed, auctor at libero. Morbi iaculis ligula ut mi tristique pretium. In vehicula auctor massa eu ultricies. Sed at nibh in risus porttitor ullamcorper.        
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}
          sx={{
            alignItems: 'center', 
            alignContent: 'center',
            justifyItems: 'center',
            justifyContent: 'center'}}
            >
          <Stack 
            direction="column" 
            alignItems="center"
            justifyItems="center"
            spacing={4}
            px={4}
            maxWidth={500}
            >
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
      </Grid>
      </Box>
    


  </Section>
}
