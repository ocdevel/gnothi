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

import SummarizeIcon from '@mui/icons-material/FitScreen'
import ThemeIcon from '@mui/icons-material/Insights';
import BookIcon from '@mui/icons-material/AutoStoriesRounded';
import TagIcon from '@mui/icons-material/LocalOffer';
import BehaviorIcon from '@mui/icons-material/InsertChart';

const spacing = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 12
}
const iconSx = {fontSize: 40}
const colors = {
  grey: "#FAFAFA",
  primaryMain: "#50577A",
  primaryLight: "#A7ABBC",
  black: "#000000",
  white: "#FFFFFF"
}
const sx = {
  button1: {backgroundColor: "primary.main", color: colors.white, fontFamily: "Poppins"},
  button2: {backgroundColor: "primary.light", color: colors.black, fontFamily: "Poppins"}
}
const button1 = {
}

type FeatureCard = {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}
function FeatureCard({title, icon, children}: FeatureCard) {
  return <Grid
    item
    xs={12}
    md={4}
  >
    <Card
      sx={{
        backgroundColor: colors.white,
        borderRadius: 5,
        elevation: 12
      }}
    >
      <CardContent>
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={spacing.sm}
        >
          {icon}
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body1">{children}</Typography>
          <Button variant="text">
            Details
          </Button>
        </Stack>
      </CardContent>
    </Card>
  </Grid>
}

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

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    <Stack
      alignItems="space-between"
      justifyContent="space-between"
      direction="row"
      sx={{padding: spacing.md}}
    >
      <Box>{' '}</Box>
      <Link.Anchor to='/'>
        <img src="/Gnothi-LOGO-G10.png" height={50} />
      </Link.Anchor>
      <Stack spacing={spacing.sm} direction="row">
        <Link.Button
          variant='contained'
          sx={sx.button1}
          to='?login=true'
          id="button-show-login"
        >Sign Up</Link.Button>
        <Link.Button
          variant='contained'
          sx={sx.button2}
          to='?register=true'
          id="button-show-register"
        >Log In</Link.Button>
      </Stack>
        {/*<Route path='/reset-password'>
          <div className='auth-block'>
            <ResetPassword />
          </div>
        </Route>*/}
        {/*<Route path='/auth/old' element={<Authenticate />} />*/}
    </Stack>

    {/*<Outlet />*/}

    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{

        padding: spacing.lg,
        backgroundColor: colors.primaryMain
      }}
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
        <Box mt={spacing.lg}>
          {(showLogin || showRegister) && <AuthComponent />}
        </Box>
      </Stack>
    </Stack>

    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={spacing.lg}
      sx={{py: spacing.lg, px: spacing.xl}}
    >
      <Typography
        variant="h3"
      >
        A new kind of journal...
      </Typography>
      <Typography
        sx={{textAlign: "center"}}
      >
        Gnothi uses a variety of cutting-edge machine learning models that make connections between what you’re writing, how you’re feeling, and your daily habits. That’s where most of us get stuck and overwhelmed. Gnothi helps you narrow your focus so you can navigate your journey of self-discovery with more awareness and direction.
      </Typography>
      <Button
        variant='contained'
        sx={{backgroundColor: colors.primaryMain, color: colors.white, width: 360}}
      >
        Explore the features
      </Button>
    </Stack>

    <Grid 
      container 
      spacing={3}
      justifyContent="center"
      alignItems="center"
    >
      <FeatureCard
        title="Summarization"
        icon={<SummarizeIcon sx={iconSx} />}
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus ipsum viverra etiam.
        Details
      </FeatureCard>
      <FeatureCard
        title="Theme Generator"
        icon={<ThemeIcon sx={iconSx} />}
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus ipsum viverra etiam.
        Details
      </FeatureCard>
      <FeatureCard
        title="Book Suggestions"
        icon={<BookIcon sx={iconSx} />}
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus ipsum viverra etiam.
        Details
      </FeatureCard>
      <FeatureCard
        title="Tagging & Sharing"
        icon={<TagIcon sx={iconSx} />}
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus ipsum viverra etiam.
        Details
      </FeatureCard>
      <FeatureCard
        title="Behavior Tracking"
        icon={<BehaviorIcon sx={iconSx} />}
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Purus ipsum viverra etiam.
        Details
      </FeatureCard>
    </Grid>

    <Stack
      direction="row"
      spacing={spacing.lg}
      sx={{
        backgroundColor: colors.primaryLight,
        padding: spacing.xl
    }}
    >
      <Stack
        justifyContent="center"
        spacing={spacing.sm}
      >
        <Typography variant="h3">See the AI in action...</Typography>
        <Typography>
          Most of the features are completely free. The goal is to provide a platform that prioritizes mental health.
          <br />
          Whether you sign up for a free account or Gnothi Premium, there’s a lot to offer and much more to come.
        </Typography>
        <Box>
          <Button
            sx={{
              backgroundColor: colors.primaryMain,
              color: colors.white
            }}
          >
            Watch a demo
          </Button>
        </Box>
      </Stack>
      <Box>
        <Skeleton animation="wave" variant="rectangular" width={590} height={400} />
      </Box>
    </Stack>

    {/*<Grid
      container
      justifyContent="center"
    >
      <Grid item xs={0} md={2}></Grid>
      <Grid item xs={12} md={8}>
        <Typography variant="h3">We’re a small company, but we’re doing big things</Typography>
      </Grid>
      <Grid item xs={0} md={2}></Grid>
    </Grid>*/}

    <Stack
      sx={{padding: spacing.xl}}
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

  </Stack>
}
