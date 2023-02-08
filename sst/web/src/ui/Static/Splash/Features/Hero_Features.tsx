import {Section, Skeleton3, Skeleton5} from "../Home/Utils";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {styles} from '../../../Setup/Mui'
import Grid from "@mui/material/Grid";
const {spacing, colors, sx} = styles

export default   function Hero_Features() {
  return <Section color="dark">

    <Grid container
      direction="row"
      spacing={4}
      alignItems='flex-end'
      justifyContent='center'
      >
        

        <Grid item xs={12} md={6}> 
          <Grid container
            direction="column"
            spacing={2}>

              <Grid item xs={12}>
                <Typography
                  variant="h1"
                  maxWidth={500}
                  sx={{
                    textAlign: "flex-start", 
                    color: colors.white, 
                    mt: { xs: 4, sm: 10 }}}
                >
                It's all about the insights
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography
                  variant="h4"
                  maxWidth= {500}
                  sx={{
                    textAlign: "flex-start", 
                    color: colors.white}}
                >
                Get more out of your journal with helpful feedback from AI
               </Typography>
              </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}> 
          <Skeleton3/>
        </Grid>

    </Grid>
      

  </Section>
}

<Stack
        spacing={2}
        sx={{
          display: "flex",
          direction: "column",
          alignItems: "center",
        }}>
        <Typography
          variant="h1"
          maxWidth={500}
          sx={{
            textAlign: "center", 
            color: colors.white, 
            mt: { xs: 4, sm: 10 }}}
          >
          It's all about the insights
        </Typography>

        <Typography
          variant="h4"
          maxWidth= {500}
          sx={{
            textAlign: "center", 
            color: colors.white}}
        >
          Get more out of your journal with helpful feedback from AI
        </Typography>
      </Stack>