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
                title={"Summaries: Get helpful snapshots"} 
                color='#59547a'
              >
                <Typography>
                Turn a long entry into a short snippet, or summarize a whole year of entries. AI summarizes your entries over days, weeks, months, or years. 
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Themes: Zoom out with keywords"} 
                color='#59547a'
              >
                <Typography>
                Our lives are often vexed by a handful of the same recurring issues. You might not even be aware of these until you step back. AI can help with this process. 
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Use themes and summaries in therapy"} 
                color='#59547a'
              >
                <Typography>
                If you choose to share specified journals with a therapist, they'll be able to generate these insights for a quick catch-up, so you get the most out of each session. 
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