import {Section, Skeleton2, Skeleton4, Skeleton5} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'

export default function FreeVsPremium () {
  return <Section color="grey">

  <Box 
    sx={{
      display: "flex",
      alignContent: "center",
      justifyContent: "center",
      borderStyle: 'solid',
      borderColor: "secondary.main",
      borderWidth: '5px',
      borderRadius: 10,
      px: 2,
      py:0
    }}
    >

      <Grid container 
         mb={5}
         flexDirection='column'
         justifyContent='center'
         alignItems='center'
         maxWidth={550}
        >
          <Grid item xs={12}>         
            <Typography 
              variant="subtitle1" 
              textAlign="center"
              paddingTop={3}
              paddingBottom={1}
              color='black'
              fontWeight={600}
            >
              What's the difference between a free and premium subscription?
            </Typography>
            <Typography
              textAlign="center">
              As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
            </Typography>
          </Grid>

        

      </Grid>
  </Box>

</Section>

}