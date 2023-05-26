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
import {useStore} from '../../../data/store'
import Error from '../../../ui/Components/Error'
import {Link} from '../../../ui/Components/Link'
import Stack from "@mui/material/Stack";
import {BasicDialog, FullScreenDialog} from "../../Components/Dialog";
import Button from "@mui/material/Button";
import {AuthComponent} from "../../Setup/Auth";
import AppBar from "../../Components/AppBar";
import {styles} from "../../Setup/Mui"
import {useLocalStore} from './store'
import {shallow} from "zustand/shallow";

const {sx, colors, spacing} = styles
import Footer from '../../Footer'

export default function Layout() {
  const [authTab, setAuthTab] = useLocalStore(s => [s.authTab, s.setAuthTab], shallow)
  const error = useStore(state => state.apiError)
  const jwt = useStore(state => state.jwt)

  // Sign In button not in <Switch> because it uses the flex/center css from jumbotron, the auth routes use left-just
  // const showSignin = !jwt && !~['/auth', '/reset-password'].indexOf(location.pathname)

  function renderAppbar() {
    return <AppBar
      ctas={[
        {name: "Sign Up", onClick: () => setAuthTab("signUp"), secondary: true},
        {name: "Log In", onClick: () => setAuthTab("signIn")}
      ]}

    />
    {/*<Route path='/reset-password'>
      <div className='auth-block'>
        <ResetPassword />
      </div>
    </Route>*/}
    {/*<Route path='/auth/old' element={<Authenticate />} />*/}
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
    {renderAppbar()}
    {renderAuthModal()}
    <Outlet />

    <Footer />
  </Stack>
}
