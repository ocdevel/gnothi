import {Section, Skeleton2, Skeleton4, Skeleton5} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import { FeatureIntro } from "../Home/DiscoverAI";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { AlignHorizontalRight } from "@mui/icons-material";

const {spacing, colors, sx} = styles

type FeatureIntroBehaviors = {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}

export function FeatureIntroBehaviors({ icon, title, children }: FeatureIntroBehaviors){
  return <Grid item xs={6}>
    <Stack
      px={4}
      direction="row"
      alignItems="flex-start"
      justifyContent="center"
      spacing={2}
    >
      {icon}  
      <Box maxWidth={450}>
        <Typography 
        variant='h6' 
        color='#507a6f'
        marginBottom={1}>{title}
        </Typography>

        <Typography 
        variant="body1"
        >{children}</Typography>
      </Box>
    </Stack>
  </Grid>
}


export default function BehaviorTracking() {
  return <Section color="grey">

    <Box 
      sx={{
        borderBottomStyle: 'solid',
        borderBottomColor: "secondary.main",
        borderBottomWidth: '1.5px',
        paddingBottom: 10
      }}
      >

      <Grid 
         container 
         mb={7}
         flexDirection='row'
         justifyContent='space-between'
         alignItems='center'
         spacing={4}>

        <Grid item xs={12}> 
          <Box
            display="flex"
            justifyContent="flex-end"
            mb={2}>
            <FitnessCenterIcon sx={sx.behaviorIconLg}/>
          </Box>         
          <Typography 
            variant="subtitle1" 
            textAlign="right"
            paddingBottom={4}
            color='#507a6f'
            fontWeight={600}
          >
            Find out how your choices impact you with behavior tracking
          </Typography>
        </Grid>

        

          <Grid item xs={12} md={6}>
          <Skeleton5/>
          </Grid>

          <Grid item xs={12} md={6}>

            <Grid container
            direction="column"
            spacing={6}
            alignItems="flex-end"
            > 

            <FeatureIntroBehaviors
              title={"Identify themes and patterns"} 
            >
              <Typography>
              As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
              </Typography>
            </FeatureIntroBehaviors>

            <FeatureIntroBehaviors
              title={"Identify themes and patterns"} 
            >
              <Typography>
              As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
              </Typography>
            </FeatureIntroBehaviors>

          </Grid>

        </Grid>
      </Grid>



      <Grid 
         container 
         mb={7}
         flexDirection='row'
         justifyContent='space-between'
         alignItems='center'
         spacing={4}>

          <Grid item xs={12} md={6}>

            <Grid container
            direction="column"
            spacing={6}
            alignItems="flex-end"
            > 

            <FeatureIntroBehaviors
              title={"Identify themes and patterns"} 
            >
              <Typography>
              As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
              </Typography>
            </FeatureIntroBehaviors>

            <FeatureIntroBehaviors
              title={"Identify themes and patterns"} 
            >
              <Typography>
              As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
              </Typography>
            </FeatureIntroBehaviors>

          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Skeleton5/>
          </Grid>

      </Grid>


    </Box>
  </Section>

}