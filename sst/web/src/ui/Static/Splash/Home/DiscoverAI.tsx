import {Section} from "./Utils";
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default function DiscoverAI() {
    return <Section color="grey">

        <Grid container spacing={5}>

          <Grid item xs={12}>
              <Typography
                variant="h3"
                align='center'
              >
                Discover more with AI
              </Typography>

              <Typography
                textAlign="center"
                color='black'    
                maxWidth={590}
                mb={10}
                >
                Gnothi helps you make sense of what is going on in your life. With insights and interactive prompting from AI, you can navigate your journey of self-discovery with more awareness, clarity, and direction.        
              </Typography>
          </Grid>
              
          <Grid item xs={6}>
              <Typography 
                variant="h3" 
                align='left'
                >
                See the AI in action
              </Typography>

              <Typography>
                Most of the features are completely free. The goal is to provide a platform that prioritizes mental health. Whether you sign up for a free account or Gnothi Premium, there’s a lot to offer and much more to come.
              </Typography>
          </Grid>
        
            <Grid item xs={6}>
              <Skeleton 
              animation="wave" 
              variant="rectangular" 
              width={590} 
              height={400} />
            </Grid>

            <Grid item xs={12} sx={{display: 'flex', justifyContent: "center"}}>
              <Button
                variant="contained"
                sx={{backgroundColor: "primary.main", color: colors.white, marginTop: '1rem'}}
              >
                Explore the features
              </Button>
            </Grid>

        </Grid>
    </Section>
  }
