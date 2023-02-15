import {Section, Skeleton2, Skeleton3, Skeleton4, Skeleton5} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import TroubleshootOutlinedIcon from '@mui/icons-material/TroubleshootOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';

import { FeatureIntro } from "../Utils";

const {spacing, colors, sx} = styles

export default function ThemesSummaries () {
  return <Section color="grey">

  <Box 
    sx={{
      borderBottomStyle: 'solid',
      borderBottomColor: "secondary.main",
      borderBottomWidth: '1.5px',
      paddingBottom: 10
    }}
    >

    <Grid container
       mb={7}
       flexDirection='row'
       justifyContent='space-between'
       alignItems='center'
       spacing={4}
       >

      <Grid item xs={12}> 
        <Box
          display="flex"
          justifyContent="flex-start"
          mb={2}>
          <InsightsOutlinedIcon sx={sx.themesSummariesIconLg}/>
        </Box>         
          <Typography 
            variant="subtitle1" 
            textAlign="left"
            paddingBottom={4}
            color='#59547a'
            fontWeight={600}
          >
            Identify recurring patterns with themes and summaries
          </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
          
          <Grid container
              direction="column"
              spacing={6}
              alignItems="flex-end"
              > 

              <FeatureIntro
                title={"Identify themes and patterns"} 
                color='#59547a'
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Identify themes and patterns"} 
                color='#59547a'
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Identify themes and patterns"} 
                color='#59547a'
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntro>

            </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* <Skeleton animation="wave" variant="rectangular" width={590} height={400} /> */}
          <Skeleton3 />
        </Grid>

      


    </Grid>

  </Box>
</Section>


}