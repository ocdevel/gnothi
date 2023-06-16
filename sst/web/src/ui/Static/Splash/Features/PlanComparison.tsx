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

            >
              Premium
            </Typography>
            <Typography
              marginTop={1}
              variant="subtitle2"
              textAlign="left"
              color='#50627a'
            >
              $8.99
            </Typography>
            <Typography
              variant="body2"
              textAlign="left"
              color='black'
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

            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              GPT-enabled chat, called <i>Prompt</i>
            </Typography>
            <Typography
              variant="body2"
              textAlign="left"
              color='black'
            >
              Game-changing AI feature that will take your journaling to the next level
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {customIcon} Custom prompts: ask AI anything
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={1}
            >
              {dreamsIcon} Run dream interpretations
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={1}
            >
              {suggestedIcon} Suggested next journal topics
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={1}
            >
              {enhancedIcon} Better quality summaries and themes
            </Typography>


            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {feedbackIcon} Get feedback on entries
            </Typography>

            {/*<Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Advanced search capabilities
            </Typography>
            <Typography
              variant="body2"
              textAlign="left"
              color='black'
            >
              Use Magic Search to find anything from past entries in a flash, or ask your journal questions
            </Typography>*/}

            <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Personalized Support
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
            >
              Request a consultation via email to get help with onboarding so you can get the most out of Gnothi
            </Typography>
          </CardContent>


          <CardContent
          sx={{marginX: 2}}
          >
            {premiumFooter? premiumFooter() : renderDefaultFooter()}
          </CardContent>


        </Card>
      </Grid>

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

            >
              Basic
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
              variant="body2"
              textAlign="left"
              color='black'
            >
              Tried and true. Always free.
            </Typography>

            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Unlimited journal essentials
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={1}
            >

              {checkIcon2} Write as much as you want
            </Typography>

            {/*<Typography*/}
            {/*  variant="body2"*/}
            {/*  textAlign="left"*/}
            {/*  color='black'*/}
            {/*  marginLeft={1}*/}
            {/*  marginTop={.5}*/}
            {/*>*/}
            {/*  {checkIcon2} Run unlimited themes and summaries*/}
            {/*</Typography>*/}

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon2} Track behaviors and get AI insights
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon2} Get personalized book recommendations
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon2} Organize entries with custom tags
            </Typography>

            {/*<Typography*/}
            {/*  variant="body2"*/}
            {/*  textAlign="left"*/}
            {/*  color='black'*/}
            {/*  marginLeft={1}*/}
            {/*  marginTop={.5}*/}
            {/*>*/}
            {/*  {checkIcon2} Share entries with friends or therapists*/}
            {/*</Typography>*/}

            <Typography
              marginTop={2}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              Community Support
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              //marginBottom={2.5}
            >
              Get access to videos, tutorials, and other information to learn how to take advantage of all the features
            </Typography>

          </CardContent>

          <CardContent
          sx={{marginX: 2}}
          >
            {basicFooter ? basicFooter() : renderDefaultFooter()}
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  </Box>
}
