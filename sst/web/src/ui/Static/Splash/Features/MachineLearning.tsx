import {Section, Skeleton2} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default function MachineLearning() {
    return <Section color="grey">

      <Box>
      <Grid container
        direction="row"
        spacing={4}
        alignItems="center"
        justifyContent="center"
      >

        <Grid item xs={12} md={6}>
          {/* <Skeleton animation="wave" variant="rectangular" width={590} height={400} /> */}
          <Skeleton2 />
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container
            direction="column"
            spacing={2}
            >
              <Grid item xs={12}> 
                 <Typography 
                  variant="h2" 
                  textAlign="left"
                >
                 How does it work?
                </Typography>
              </Grid> 

              <Grid item xs={12}> 
                 <Typography>
                 Gnothi uses machine learning models like GPT-3, among others, that have been trained on large sets of data, to be able to provide you with helpful information, or insights.   
                </Typography>
              </Grid> 

              <Grid item xs={12}> 
                 <Typography>
                 The more you journal and interact with Gnothi, the more specific the insights will become.     
                </Typography>
              </Grid> 
          </Grid>
        </Grid>

      </Grid>
      </Box>
    </Section>
  }