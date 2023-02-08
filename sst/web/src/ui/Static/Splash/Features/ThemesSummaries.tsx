import {Section, Skeleton2, Skeleton4, Skeleton5} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import TroubleshootOutlinedIcon from '@mui/icons-material/TroubleshootOutlined';

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
          <TroubleshootOutlinedIcon sx={sx.themesSummariesIconLg}/>
        </Box>         
          <Typography 
            variant="subtitle1" 
            textAlign="left"
            paddingBottom={4}
            color='#507a6f'
            fontWeight={600}
          >
            Identify recurring patterns with themes and summaries
          </Typography>
      </Grid>

      <Grid item xs={12} md={4}>

      </Grid>


    </Grid>

  </Box>
</Section>


}