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

function PlanCard({children}: React.PropsWithChildren) {
  return <Card
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
    {children}
  </Card>
}

function FeatureItem({title, content, mt=2}: { title: string, content: string, mt?: number }) {
  return <>
    <Typography
      marginTop={mt}
      variant="body1"
      fontWeight={500}
      textAlign="left"
      color='#50627a'
    >
      {title}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={500}
      textAlign="left"
      color='#50627a'
    >
      {content}
    </Typography>
  </>
}

function PlanBody({children}: React.PropsWithChildren) {

}

const featureIcon = {fontSize: "inherit", color: "secondary"}
const dreamsIcon = <DreamsIcon {...featureIcon} />
const feedbackIcon = <FeedbackIcon {...featureIcon} />
const customIcon = <CustomIcon {...featureIcon} />
const suggestedIcon = <SuggestedIcon {...featureIcon} />
const enhancedIcon = <EnhancedIcon {...featureIcon} />

const checkIcon2 = <CheckIcon sx={{color: "#59887c"}}
  fontSize='inherit'
/>

interface PlanComparison {
  premiumFooter?: any
  basicfooter?: any
}
export default function PlanComparison({
  premiumFooter,
  basicFooter,
}: PlanComparison) {
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

      <Grid
        item
        xs={12} md={4}
      >
        <PlanCard>
          <CardContent sx={{marginX: 2}}>
            <Typography
              variant="h4"
              fontWeight={600}
              textAlign="left"
              color="primary"
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


          <FeatureItem
            mt={3}
            title="Unlimited Journal Entries:"
            // content="Write freely, no limits attached"
            content="Write as much as you want, whenever you want"
          />
          <FeatureItem
            title="Behavior Tracking & Insights:"
            content="Monitor habits and understand their correlations"
          />
          <FeatureItem
            title="Advanced Search Options:"
            content="Use keyword, date, and semantic search to find entries"
          />
          <FeatureItem
            title="Book Recommendations:"
            content="Discover reads that resonate with your journal themes"
          />
          </CardContent>

          <CardContent sx={{marginX: 2}}>
            {basicFooter ? basicFooter() : renderDefaultFooter()}
          </CardContent>


        </PlanCard>
      </Grid>



      <Grid
        item
        xs={12} md={4}
      >

        <PlanCard>
          <CardContent sx={{marginX: 2}}>
            <Typography
              variant="h4"
              fontWeight={600}
              textAlign="left"
              color="primary"
              mb={0}

            >
              Premium
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
            <Typography
              variant="body2"
              textAlign="left"
              color='#50627a'
            >
              Billed monthly. Cancel anytime.
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

            <FeatureItem
              title="Interactive AI Chat:"
              content="Get dream interpretations, feedback, journal prompts, and more"
            />

            <FeatureItem
              mt={3}
              title="Summaries and Themes:"
              content="Capture recurring patterns across your entries"
            />
            <FeatureItem
              title="Magic Search:"
              // content="Scan and interpret your complete journal history"
              content="Query your entire journal history to extract valuable insights"
            />
          </CardContent>


          <CardContent sx={{marginX: 2}}>
            {premiumFooter? premiumFooter() : renderDefaultFooter()}
          </CardContent>


        </PlanCard>
      </Grid>

    </Grid>
  </Box>
}
