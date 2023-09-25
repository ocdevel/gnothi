import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button, {ButtonProps} from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import * as React from 'react';
import {Section, Skeleton2} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {FeatureIntro} from "../Utils";
import {useTheme} from '@mui/material/styles';
import {Link} from "../../../Components/Link"
import List from "@mui/material/List";
import ListItem_ from "@mui/material/ListItem";
import CardActions from "@mui/material/CardActions";
import CheckIcon from '@mui/icons-material/TaskAlt';
import StarIcon from '@mui/icons-material/StarBorder';
import DreamsIcon from '@mui/icons-material/BedtimeOutlined';
import FeedbackIcon from '@mui/icons-material/ThumbUpAltOutlined';
import SuggestedIcon from '@mui/icons-material/ExploreOutlined';
import EnhancedIcon from '@mui/icons-material/UpgradeOutlined';
import CustomIcon from '@mui/icons-material/ChatOutlined';

export const buttonDefaults = {
  sx: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 2,
  },
  variant: 'contained',
  size: 'small',
  color: "secondary"
} as unknown as ButtonProps

interface PlanComparison {
  premiumFooter?: any
  basicfooter?: any
}
export default function PlanComparison({
  premiumFooter,
  basicFooter,
}: PlanComparison) {
  const featureIcon = {fontSize: "inherit", color: "secondary"}
  const dreamsIcon = <DreamsIcon {...featureIcon} />
  const feedbackIcon = <FeedbackIcon {...featureIcon} />
  const customIcon = <CustomIcon {...featureIcon} />
  const suggestedIcon = <SuggestedIcon {...featureIcon} />
  const enhancedIcon = <EnhancedIcon {...featureIcon} />

  const checkIcon2 = <CheckIcon sx={{color: "#59887c"}}
    fontSize='inherit'
  />

  function renderDefaultFooter() {
     return <Button
        {...buttonDefaults}
     >
       Sign up
     </Button>
  }

  return <Box
    sx={{mt: 10}}>

    <Grid
      container
      direction='row'
      spacing={8}
      justifyContent='center'
    >

      <Grid item
            xs={12} md={4}
      >
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            borderRadius: 3,
            borderColor: '#50577A',
            borderStyle: 'solid',
            borderWidth: '1px',
          }}
        >
          <CardContent
          sx={{marginX: 2}}
          >
            <Typography
              variant="h4"
              fontWeight={600}
              textAlign="left"
              color='#50627a'
              mb={0}

            >
              Basic
            </Typography>
            <Typography
              variant="body1"
              textAlign="left"
              color='secondary'
              fontWeight={500}
            >
              Pure Journaling, Zero AI
            </Typography>
            <Typography
              marginTop={1}
              variant="subtitle2"
              textAlign="left"
              color='#50627a'
            >
              $0
            </Typography>


            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Unlimited Journal Entries:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Write as much as you want, whenever you want
            </Typography>

            <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Behavior Tracking:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Keep tabs on your habits and activities
            </Typography>

             <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Tagging System:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Organize your entries for easy retrieval
            </Typography>

             <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Keyword & Date Search:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Find past entries effortlessly
            </Typography>



          </CardContent>

          <CardContent
          sx={{marginX: 2}}
          >
            {basicFooter ? basicFooter() : renderDefaultFooter()}
          </CardContent>
        </Card>
      </Grid>

      <Grid
        item
        xs={12} md={4}
      >

        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            borderRadius: 3,
            borderColor: '#50577A',
            borderStyle: 'solid',
            borderWidth: '1px',
          }}
        >
          <CardContent sx={{marginX: 2
          }}
          >
            <Typography
              variant="h4"
              fontWeight={600}
              textAlign="left"
              color="primary"
              mb={0}

            >
              Analytic
            </Typography>
            <Typography
              variant="body1"
              textAlign="left"
              color='secondary'
              fontWeight={500}
            >
              AI Insights, No Generative AI
            </Typography>
            <Typography
              marginTop={1}
              variant="subtitle2"
              textAlign="left"
              color='#50627a'
            >
              $0
            </Typography>


            <Stack
              marginTop={3}
              direction="row"
              spacing={.5}
              alignItems="center"
            >
              <CheckIcon
                fontSize='inherit'
                sx={{color: "#59887c"}}
              />
              <Typography
                variant="body1"
                fontWeight={700}
                textAlign="left"
                color='#59887c'
                //sx={{textDecoration: 'underline'}}
              >
                Everything in Basic, plus:
              </Typography>
            </Stack>

            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Behavior Insights:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Understand correlations and patterns in your activities
            </Typography>

            <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Book Recommendations:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Get curated reads that align with your journal themes
            </Typography>

             <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Semantic Search:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Go beyond keywords with context-aware search
            </Typography>
          </CardContent>


          <CardContent
          sx={{marginX: 2}}
          >
            {premiumFooter? premiumFooter() : renderDefaultFooter()}
          </CardContent>


        </Card>
      </Grid>



      <Grid
        item
        xs={12} md={4}
      >

        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            borderRadius: 3,
            borderColor: '#50577A',
            borderStyle: 'solid',
            borderWidth: '1px',
          }}
        >
          <CardContent sx={{marginX: 2
          }}
          >
            <Typography
              variant="h4"
              fontWeight={600}
              textAlign="left"
              color="primary"
              mb={0}

            >
              Generative
            </Typography>
            <Typography
              variant="body1"
              textAlign="left"
              color='secondary'
              fontWeight={500}
            >
              All-Inclusive AI Experience
            </Typography>
            <Typography
              marginTop={1}
              variant="subtitle2"
              textAlign="left"
              color='#50627a'
            >
              $4.99
            </Typography>

            <Stack
              marginTop={3}
              direction="row"
              spacing={.5}
              alignItems="center"
            >
              <CheckIcon
                fontSize='inherit'
                sx={{color: "#59887c"}}
              />
              <Typography
                variant="body1"
                fontWeight={700}
                textAlign="left"
                color='#59887c'
                //sx={{textDecoration: 'underline'}}
              >
                Everything in Analytic, plus:
              </Typography>
            </Stack>

            <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Interactive AI Chat:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Get dream interpretations, feedback, journal prompts, and more
            </Typography>

            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Summaries and Themes:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              See what AI sees to dive deeper
            </Typography>



             <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Magic Search:
            </Typography>
            <Typography
              variant="body2"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Scan and interpret your complete journal history
            </Typography>
          </CardContent>


          <CardContent
          sx={{marginX: 2}}
          >
            {premiumFooter? premiumFooter() : renderDefaultFooter()}
          </CardContent>


        </Card>
      </Grid>

    </Grid>
  </Box>
}
