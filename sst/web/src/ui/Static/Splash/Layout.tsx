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
import {
  spacing,
  colors,
  sx
} from "./Utils"
import Button from "@mui/material/Button";
import {AuthComponent} from "../../Setup/Auth";

export default function Layout() {
  const location = useLocation()
  let [searchParams, setSearchParams] = useSearchParams();
  const [showAuth, setShowAuth] = useState<"login"|"signup"|false>(false)
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
              onClick={() => setShowAuth("login")}
              id="button-show-login"
            >Sign Up</Button>
            <Button
              variant='contained'
              sx={sx.button2}
              onClick={() => setShowAuth("signup")}
              id="button-show-signup"
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
      open={showAuth !== false}
      onClose={() => setShowAuth(false)}
      size="xl"
    >
      <AuthComponent />
    </BasicDialog>
  }

  return <Stack
    sx={{
      backgroundColor: colors.grey
    }}
  >
    <Error message={error} />
    {renderToolbar()}
    {renderAuthModal()}
    <Outlet />

  </Stack>
}
