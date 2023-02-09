import {Section, Skeleton2, Skeleton3} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui';
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { FeatureIntro } from "../Utils";

const {spacing, colors, sx} = styles

export default function Books() {
    return <Section color="grey">

      <Box
        sx={{
          borderBottomStyle: 'solid',
          borderBottomColor: "secondary.main",
          borderBottomWidth: '1.5px',

          paddingBottom: 10
        }}>

      <Grid container
        direction="row"
        spacing={4}
        alignItems="center"
        justifyContent="center"
      >

        <Grid item xs={12}> 
        <Box
              display="flex"
              justifyContent="flex-end"
              mb={2}>
              <AutoStoriesOutlinedIcon sx={sx.booksIconLg}/>
            </Box>
          <Typography 
            variant="subtitle1" 
            textAlign="right"
            paddingBottom={4}
            color='#553840'
            fontWeight={600}
          >
            Deepen your understanding with personalized book recommendations
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
                color='#553840'
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Identify themes and patterns"} 
                color='#553840'
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Identify themes and patterns"} 
                color='#553840'
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