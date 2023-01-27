import {Section, Skeleton2} from "./Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles

export default function Demo() {
    return <Section color="light">
      <Grid container
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={12} md={6}>
          <Stack
            maxWidth={500} 
            display= 'flex'
            justifyItems= "flex-start"
            alignItems= "flex-start"
            >

              <Typography 
                variant="h2" 
                textAlign="left"
              >
              See Gnothi in action
              </Typography>
              
              <Typography>
              Get a quick overview of all the ways you can use Gnothi. Whether you sign up for a free or premium account, there’s a lot to offer and much more to come.            
              </Typography>

            <Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "primary.main",
                  color: colors.white,
                  marginTop: '2rem',
                  marginBottom: "1rem"
                }}
              >
                Watch a demo
              </Button>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          {/* <Skeleton animation="wave" variant="rectangular" width={590} height={400} /> */}
          <Skeleton2 />
        </Grid>
      </Grid>
    </Section>
  }