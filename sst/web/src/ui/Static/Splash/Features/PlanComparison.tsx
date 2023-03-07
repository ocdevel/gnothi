import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {styles} from '../../../Setup/Mui'
import * as React from 'react';
import {Section, Skeleton2} from "../Home/Utils";
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { FeatureIntro } from "../Utils";
import { useTheme } from '@mui/material/styles';
import {Link} from "../../../Components/Link"
import List from "@mui/material/List";
import ListItem_ from "@mui/material/ListItem";
import CardActions from "@mui/material/CardActions";
import CheckIcon from '@mui/icons-material/TaskAlt';



export default function PlanComparison() {
  const checkIcon = <CheckIcon
    fontSize='inherit'
    color='secondary'
  />
  return <Box
    sx={{ mt: 10}}>

    <Grid container
      direction='row'
      spacing={8}
      justifyContent='center'
      alignItems='flex-start'
      >

      <Grid item
        xs={12} md={4}>
        <Card
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: 3,
            borderColor: '#50577A',
            borderStyle: 'solid',
            borderWidth: '1px'
        }}
          >
          <CardContent>
            <Typography
              variant="subtitle2"
              textAlign="left"
              color='#50627a'

            >
              Premium
            </Typography>
            <Typography
              marginTop={1}
              variant="subtitle2"
              textAlign="left"
              color='#50627a'
            >
              $9.99
            </Typography>
            <Typography
              variant="body2"
              textAlign="left"
              color='black'
            >
              Billed monthly. Cancel anytime.
            </Typography>

            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#59887c'
              sx={{textDecoration: 'underline'}}
            >
              Everything in Basic, plus:
            </Typography>

            <Typography
              marginTop={3}
              variant="body1"
              fontWeight={500}
              textAlign="left"
              color='#50627a'
            >
              AI interactive chat
            </Typography>
            <Typography
              variant="body2"
              textAlign="left"
              color='black'
            >
            Run dream interpretations, get feedback on entries, and create custom prompts to ask AI anything
            </Typography>

            <Typography
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
            </Typography>


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
            Request a consultation to get help with onboarding so you can get the most out of Gnothi
            </Typography>
             </CardContent>


          <CardActions>
              <Button
                sx={{alignItems:'center', justifyContent:'center', width: '100%', marginBottom: 2}}
                variant='contained'
                size='small'
                >
                Sign up
              </Button>
          </CardActions>


        </Card>
      </Grid>

      <Grid item
        xs={12} md={4}>
        <Card
          sx={{
            backgroundColor: '#ffffff',
            borderRadius: 3,
            borderColor: '#50577A',
            borderStyle: 'solid',
            borderWidth: '1px'
        }}
          >
          <CardContent>
            <Typography
              variant="subtitle2"
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

              {checkIcon} Write as much as you want
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon} Run unlimited themes and summaries
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon} Track behaviors and get AI insights
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon} Get personalized book recommendations
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon} Organize entries with custom tags
            </Typography>

            <Typography
              variant="body2"
              textAlign="left"
              color='black'
              marginLeft={1}
              marginTop={.5}
            >
              {checkIcon} Share entries with friends or therapists
            </Typography>

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
              marginBottom={2.5}
            >
            Get access to videos, tutorials, and other information to learn how to take advantage of all the features
            </Typography>

          </CardContent>

          <CardActions>
              <Button
                sx={{alignItems:'center', justifyContent:'center', width: '100%', marginBottom: 2}}
                variant='contained'
                size='small'
                >
                Sign up
              </Button>
          </CardActions>
        </Card>
      </Grid>

    </Grid>
  </Box>
}
