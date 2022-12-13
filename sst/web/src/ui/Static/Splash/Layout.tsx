import React, {useState, useEffect} from 'react'
import {
  Routes,
  Route,
  useLocation,
  useSearchParams,
  useNavigate,
  Outlet
} from "react-router-dom"
import Grid from '@mui/material/Grid'
import {useStore} from '@gnothi/web/src/data/store'
import Error from '@gnothi/web/src/ui/Components/Error'
import {Link} from '@gnothi/web/src/ui/Components/Link'
import Stack from "@mui/material/Stack";
import {BasicDialog, FullScreenDialog} from "../../Components/Dialog";
import Button from "@mui/material/Button";
import {AuthComponent} from "../../Setup/Auth";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import {styles} from "../../Setup/Mui"

const {sx, colors, spacing} = styles

export default function Layout() {
  const [authTab, setAuthTab] = useState<"signIn"|"signUp"|undefined>(undefined)
  const error = useStore(state => state.apiError)
  const jwt = useStore(state => state.jwt)

  // Sign In button not in <Switch> because it uses the flex/center css from jumbotron, the auth routes use left-just
  // const showSignin = !jwt && !~['/auth', '/reset-password'].indexOf(location.pathname)

  function renderToolbar() {
    return <Grid container
      alignItems="center"
      justifyContent="space-between"
      direction="row"
      sx={{px: spacing.lg, py: spacing.sm}}
    >
      <Grid
        item
        xs={0}
        sm={4}
        lg={2}
      />
      <Grid
        item container
        xs={6}
        sm={4}
        lg={8}
        justifyContent="center"
      >
        <Grid item>
          <Link.Anchor to='/'>
            <img src="/Gnothi-LOGO-G10.png" height={50} />
          </Link.Anchor>
        </Grid>
      </Grid>
      <Grid
        item container
        xs={6}
        sm={4}
        lg={2}
        justifyContent="flex-end"
      >
        <Grid item>
          <Stack spacing={spacing.sm} direction="row">
            <Button
              variant='contained'
              sx={sx.button1}
              onClick={() => setAuthTab("signUp")}
              className="button-show-signup"
            >Sign Up</Button>
            <Button
              variant='contained'
              sx={sx.button2}
              onClick={() => setAuthTab("signIn")}
              className="button-show-signin"
            >Log In</Button>
          </Stack>
        </Grid>
      </Grid>
        {/*<Route path='/reset-password'>
          <div className='auth-block'>
            <ResetPassword />
          </div>
        </Route>*/}
        {/*<Route path='/auth/old' element={<Authenticate />} />*/}
    </Grid>
  }
  function renderAuthModal() {
    return <BasicDialog
      open={!!authTab}
      onClose={() => setAuthTab(undefined)}
      size="xl"
    >
      <AuthComponent tab={authTab} />
    </BasicDialog>
  }

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    <AppBar
      position="fixed"
      sx={{backgroundColor: colors.grey}}
    >
      {renderToolbar()}
    </AppBar>
    <Toolbar />
    {renderAuthModal()}
    <Outlet />

  </Stack>
}
