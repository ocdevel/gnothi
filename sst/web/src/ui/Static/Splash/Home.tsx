import React from 'react'
// import {Authenticate} from "../Auth"
import {
  Routes,
  Route,
  useLocation,
  Outlet,
  useSearchParams,
  useNavigate
} from "react-router-dom"
import {AuthComponent} from '../../Setup/Auth'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import {useStore} from '@gnothi/web/src/data/store'
import Error from '@gnothi/web/src/ui/Components/Error'
import {Link} from '@gnothi/web/src/ui/Components/Link'
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Skeleton from "@mui/material/Skeleton";

import GroupsIcon from '@mui/icons-material/Groups';
import BookIcon from '@mui/icons-material/AutoStories';
import SecureIcon from "@mui/icons-material/Lock"
import InsightsIcon from '@mui/icons-material/AutoFixHigh';
import TherapyIcon from '@mui/icons-material/Chair';
import ShareIcon from '@mui/icons-material/Share';

import {spacing, colors, sx, Section, FeatureCard} from './Utils'

export default function Layout() {
  const location = useLocation()
  let [searchParams, setSearchParams] = useSearchParams();
  const error = useStore(state => state.apiError)
  const jwt = useStore(state => state.jwt)

  // Sign In button not in <Switch> because it uses the flex/center css from jumbotron, the auth routes use left-just
  const showLogin = !!searchParams.get("login")
  const showRegister = !!searchParams.get("register")
  const showAuth = showLogin || showRegister
  // const showSignin = !jwt && !~['/auth', '/reset-password'].indexOf(location.pathname)


  function renderHero() {
    return <Section color="dark">
      <Stack
        alignItems="center"
        justifyContent="center"
      >
        <Stack sx={{maxWidth: 590}} alignItems="center">
          <Typography
            variant="h1"
            sx={{textAlign: "center", color: colors.white}}
          >
            Know thyself with Gnothi
          </Typography>
          <Typography
            variant="h4"
            sx={{textAlign: "center", color: colors.white}}
          >
            An AI-powered journal and toolkit for a healthy and happy life.
          </Typography>
        </Stack>
      </Stack>
    </Section>
  }
  function renderNewJournal() {
    return <Section color="grey">
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={spacing.lg}
        sx={{paddingBottom: spacing.lg}}
      >
        <Typography
          variant="h3"
        >
          A new kind of journal...
        </Typography>
        <Typography
          sx={{textAlign: "center"}}
        >
          Gnothi uses a variety of cutting-edge machine learning models that make connections between what you’re writing, how you’re feeling, and your daily habits. That’s where most of us get stuck and overwhelmed. Gnothi helps you narrow your focus so you can navigate your journey of self-discovery with more awareness and direction.      </Typography>
        <Link.Button
          variant='contained'
          sx={{backgroundColor: colors.primaryMain, color: colors.white, width: 360}}
          to="/features"
        >
          Explore the features
        </Link.Button>
      </Stack>
      <Grid
        container
        spacing={4}
        justifyContent="center"
        alignItems="center"
      >
        <FeatureCard
          icon={<SecureIcon sx={sx.featureIcon} />}
        >
         Rest easy knowing that your entries are secure
        </FeatureCard>
        <FeatureCard
          icon={<InsightsIcon sx={sx.featureIcon} />}
        >
          Get AI-generated insights to help you grow
        </FeatureCard>
        <FeatureCard
          icon={<TherapyIcon sx={sx.featureIcon} />}
        >
         Use it in therapy to get the most from sessions
        </FeatureCard>
        <FeatureCard
          icon={<ShareIcon sx={sx.featureIcon} />}
        >
          Share entries with friends to stay connected
        </FeatureCard>
        <FeatureCard
          icon={<BookIcon sx={sx.featureIcon} />}
        >
          Read books recommended by AI just for you
        </FeatureCard>
        <FeatureCard
          icon={<GroupsIcon sx={sx.featureIcon} />}
        >
          Create and join groups for support (coming soon)
        </FeatureCard>
      </Grid>
    </Section>
  }
  function renderDemo() {
    return <Section color="light">
      <Grid container
        direction="row"
        spacing={spacing.lg}
        alignItems="center"
        justifyContent="center"
      >
        <Grid item xs={12} md={4}>
          <Stack
            justifyContent="center"
            spacing={spacing.sm}
          >
            <Typography variant="h3">See the AI in action...</Typography>
            <Typography>
              Most of the features are completely free. The goal is to provide a platform that prioritizes mental health. Whether you sign up for a free account or Gnothi Premium, there’s a lot to offer and much more to come.
            </Typography>
            <Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "primary.main",
                  color: colors.white
                }}
              >
                Watch a demo
              </Button>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <Skeleton animation="wave" variant="rectangular" width={590} height={400} />
        </Grid>
      </Grid>
    </Section>
  }
  function renderWhatsNext() {
    return <Section color='grey'>
      <Stack
        justifyContent="center"
        alignItems="center"
      >
        <Typography
          variant="h3"
          sx={{textAlign: "center", maxWidth: 1004}}
        >We’re a small company, but we’re doing big things</Typography>
        <Typography
          sx={{textAlign: "center", maxWidth: 1004}}
        >Gnothi beta was launched in 2019 and, without any marketing, has supported about 5,000 people. There’s something here. It’s helping people, and we hope to do a lot more of that. Here’s a sneak peak at what we’re working on.</Typography>
        <Stack direction="row" spacing={spacing.sm} mt={spacing.lg}>
          <Skeleton variant="rectangular" width={590} height={400} />
          <Skeleton variant="rectangular" width={590} height={400} />
        </Stack>
      </Stack>
    </Section>
  }

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    {renderHero()}
    {renderNewJournal()}
    {renderDemo()}
    {renderWhatsNext()}

  </Stack>
}
