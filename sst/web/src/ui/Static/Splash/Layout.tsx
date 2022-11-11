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

export default function Layout() {
  const location = useLocation()
  let [searchParams, setSearchParams] = useSearchParams();
  const error = useStore(state => state.apiError)
  const jwt = useStore(state => state.jwt)

  // Sign In button not in <Switch> because it uses the flex/center css from jumbotron, the auth routes use left-just
  const showLogin = !!searchParams.get("login")
  const showRegister = !!searchParams.get("register")
  // const showSignin = !jwt && !~['/auth', '/reset-password'].indexOf(location.pathname)

  function renderAuthButtons() {
    return <Stack direction="row" spacing={2}>
      <Link.Button
        variant='contained'
        to='?login=true'
        size='large'
        id="button-show-login"
      >Sign In</Link.Button>
      <Link.Button
        variant='contained'
        to='?register=true'
        size='large'
        id="button-show-register"
      >Sign In</Link.Button>
    </Stack>
  }

  return <>
    <Error message={error} />
    <Paper
      elevation={0}
      square
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        py: 5,
        mb: 4,
        backgroundColor: '#e9ecef',
      }}
    >
      <Link.Anchor to='/'>
        <header className='cursor-pointer'>
          <img src="/TransparentLogo.png" height="500" style={{marginLeft: '1rem'}}/>
        </header>
      </Link.Anchor>
      {/*<Typography variant='h3' component='h1'>Gnothi</Typography>
      <Typography variant='h5'>Gnōthi Seauton: Know Thyself</Typography>
      <Typography sx={{mb:2}}>A journal that uses AI to help you introspect and find resources</Typography>*/}
      {showLogin || showRegister ? <AuthComponent />
        : renderAuthButtons()}
        {/*<Route path='/reset-password'>
          <div className='auth-block'>
            <ResetPassword />
          </div>
        </Route>*/}
        {/*<Route path='/auth/old' element={<Authenticate />} />*/}
    </Paper>

    <Outlet />

    <Divider sx={{my: 4}}/>
    <Grid
      item container
      direction='column'
      alignItems='center'
      justifyContent='center'
    >
      <Grid item>
        <Typography variant="body2">
          Croesus inquired of the oracle what to do to live a happy life. The answer was:<br/>
          "Know yourself, O Croesus - thus you will live and be happy."
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant="caption">
          <em>- (Xenophon, Cyropaedia)</em>
        </Typography>
      </Grid>
    </Grid>
  </>
}
