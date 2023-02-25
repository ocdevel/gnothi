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
              justifyContent="flex-start"
              mb={2}>
              <AutoStoriesOutlinedIcon sx={sx.booksIconLg}/>
            </Box>
          <Typography 
            variant="subtitle1" 
            textAlign="left"
            paddingBottom={4}
            color='#7B515C'
            fontWeight={600}
          >
            Deepen your understanding with books picked for you
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>          
          <Grid container
              direction="column"
              spacing={6}
              alignItems="flex-end"
              > 

              <FeatureIntro
                title={"Get book recommendations from AI"} 
                color='#7B515C'
              >
                <Typography>
                As you journal more, you’ll start to see books that relate to your entries that Gnothi has recommended.                 </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Add titles to your bookshelf"} 
                color='#7B515C'
              >
                <Typography>
                Quickly add the books you’re interested in reading to a bookshelf you can revisit when you’re ready to read. 
                </Typography>
              </FeatureIntro>

              <FeatureIntro
                title={"Tell AI what you like or don’t like"} 
                color='#7B515C'
              >
                <Typography>
                Thumbs up and down book recommendations to point Gnothi in the right direction for future suggestions. 
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