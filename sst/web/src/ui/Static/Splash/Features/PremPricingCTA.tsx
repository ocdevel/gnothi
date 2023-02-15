import {Section} from "../Home/Utils";
import {styles} from '../../../Setup/Mui'
const {spacing, colors, sx} = styles
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { padding } from "@mui/system";

export default function PremPricingCTA() {
  return <Section color="grey">
    <Box
        sx={{
          backgroundColor: "primary.main",
          borderRadius: 10,
          paddingTop: 10,
          paddingBottom: 10,
          px: 50
          }}
          >

      <Grid container
        direction="column"
        alignItems="center"
        justifyContent="center"> 

        <Grid item xs={12}>

        <Typography 
        variant="h2" 
        textAlign='center'
        sx={{
          color: colors.white}}
        >
        Sign up for Gnothi Premium today           
        </Typography>

        <Typography 
        variant="h4" 
        textAlign='center'
        sx={{
          color: colors.white}}
        >
        Subheading here        
        </Typography>
        </Grid>

       <Grid>
        <Button
        variant="contained"
        sx={{
        backgroundColor: "primary.light",
        color: colors.white,
        marginTop: '2rem',
        }}
        >
        Sign up
        </Button>
        </Grid>
      </Grid>
       
    </Box>
  </Section>
}
