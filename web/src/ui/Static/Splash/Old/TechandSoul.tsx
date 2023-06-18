import {Section} from "../Home/Utils";
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
import Button from "@mui/material/Button";
import { Skeleton2 } from "../Home/Utils";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
const {spacing, colors, sx} = styles

export default function TechandSoul() {
  return <Section color="grey">
   <Grid container
      direction="row"
      spacing={4}
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={12} md={6}>
        <Skeleton2 />
      </Grid>

      <Grid item xs={12} md={6}>
        <Stack
          spacing= {2}
          maxWidth={500} 
          display= 'flex'
          justifyItems= "flex-start"
          alignItems= "flex-start"
          >
            <Typography 
              variant="h2" 
              textAlign="left"
            >
              Experience a new kind of journal            
            </Typography>
            
            <Typography
              variant="h4"
              textAlign="left"
              >
              The perfect combination of tech and soul            
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
       
    </Grid>
    </Section>
  }