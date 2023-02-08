import {Section, Skeleton2, Skeleton3} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui';
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';

const {spacing, colors, sx} = styles

type FeatureIntroBooks = {
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}

export function FeatureIntroBooks({ icon, title, children }: FeatureIntroBooks){
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
        color='#553840'
        marginBottom={1}>{title}
        </Typography>

        <Typography 
        variant="body1"
        >{children}</Typography>
      </Box>
    </Stack>
  </Grid>
}

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
              justifyContent="flex-end"
              mb={2}>
              <AutoStoriesOutlinedIcon sx={sx.booksIconLg}/>
            </Box>
          <Typography 
            variant="subtitle1" 
            textAlign="right"
            paddingBottom={4}
            color='#553840'
            fontWeight={600}
          >
            Deepen your understanding with personalized book recommendations
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          
          <Grid container
              direction="column"
              spacing={6}
              alignItems="flex-end"
              > 

              <FeatureIntroBooks
                title={"Identify themes and patterns"} 
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntroBooks>

              <FeatureIntroBooks
                title={"Identify themes and patterns"} 
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntroBooks>

              <FeatureIntroBooks
                title={"Identify themes and patterns"} 
              >
                <Typography>
                As you write, Gnothi will get to know you better. You’ll get insights to narrow your focus and help you grow.          
                </Typography>
              </FeatureIntroBooks>

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