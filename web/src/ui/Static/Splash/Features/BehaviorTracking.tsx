import {Section, Skeleton2, Skeleton4, Skeleton5} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import { FeatureIntro } from "../Utils";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { AlignHorizontalRight } from "@mui/icons-material";

const {spacing, colors, sx} = styles

export default function BehaviorTracking() {
  return <Section color="grey">

    <Box 
      sx={{
        borderBottomStyle: 'solid',
        borderBottomColor: "secondary.main",
        borderBottomWidth: '1.5px',
        paddingBottom: 10
      }}
      >

      <Grid 
         container 
         mb={7}
         flexDirection='row'
         justifyContent='space-between'
         alignItems='center'
         spacing={4}>

        <Grid item xs={12}> 
          <Box
            display="flex"
            justifyContent="flex-end"
            mb={2}>
            <FitnessCenterIcon sx={sx.behaviorIconLg}/>
          </Box>         
          <Typography 
            variant="subtitle1" 
            textAlign="right"
            paddingBottom={4}
            color='#507a6f'
            fontWeight={600}
          >
            Find out how your choices impact you with behavior tracking
          </Typography>
        </Grid>

        

          <Grid item xs={12} md={6}>
          <Skeleton5/>
          </Grid>

          <Grid item xs={12} md={6}>

            <Grid container
            direction="column"
            spacing={6}
            alignItems="flex-end"
            > 

            <FeatureIntro
              title={"Track custom fields"} 
              color='#507a6f'
            >
              <Typography>
              Come up with a list of things you’d like to track daily—like mood, sleep, exercise, alcohol, energy, meditation, etc. Then do quick check-ins when you journal.
              </Typography>
            </FeatureIntro>

            <FeatureIntro
              title={"Identify the top influencer"} 
              color='#507a6f'
            >
              <Typography>
              Gnothi will determine which field has the greatest impact on your life. This will be the primary habit you'll want to focus on each day. 
              </Typography>
            </FeatureIntro>

          </Grid>

        </Grid>
      </Grid>



      <Grid 
         container 
         mb={7}
         flexDirection='row'
         justifyContent='space-between'
         alignItems='center'
         spacing={4}>

          <Grid item xs={12} md={6}>

            <Grid container
            direction="column"
            spacing={6}
            alignItems="flex-end"
            > 

            <FeatureIntro
              title={"Uncover behavioral patterns"} 
              color='#507a6f'
            >
              <Typography>
              Gnothi also shows you field-to-field correlations. This allows you to see how each choice you make affects every other choice you make.
              </Typography>
            </FeatureIntro>

            <FeatureIntro
              title={"Make meaningful changes"} 
              color='#507a6f'
            >
              <Typography>
              With tons of data at your fingertips, you’ll have more clarity about what’s working, what isn’t, and which areas of your life to focus on most. 
              </Typography>
            </FeatureIntro>

          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Skeleton5/>
          </Grid>

      </Grid>


    </Box>
  </Section>

}