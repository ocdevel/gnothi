import * as React from 'react';
import Box from '@mui/material/Box';

import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect, useCallback} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {Loading} from '@gnothi/web/src/ui/Components/Routing'
import Banner from '../../Components/Banner'

import {styles} from '../../Setup/Mui'

import Container from "@mui/material/Container";
import {ErrorSnack} from "../../Components/Error";
// import GroupsToolbar from "../Groups/List/Toolbar"
// import GroupToolbar from "../Groups/View/Toolbar"
// import SharingModal from "../Sharing"
import EntryModal from "../Entries/Modal"
import BehaviorsModal from "../Behaviors/Modal"
import PremiumModal from '../Account/PremiumModal'
import BooksModal from '../Insights/Resources/Books'
import AppBar from './AppBar'
import Footer from '../../Footer'
import {AcknowledgeChecker} from "../../Setup/Acknowledge";
import UserListener from './UserListener'


// Have this separate since it'd otherwise cause a re-render after every lastJsonMessage, etc.
function SetupApi() {
  useApi()
  return null
}


function Errors() {
  // const error = useStore(state => state.apiError);
  // <Error message={error} />
  // <Error codes={[422,401,500]} />
  return <ErrorSnack />
}

function Container_() {
  // Disable left/right paddding for privacy, terms, disclaimer - since those pages add their own
  const {pathname} = useLocation()
  const disableGutters = ['/privacy', '/terms', '/disclaimer'].includes(pathname)
  return <Container maxWidth={false} disableGutters={disableGutters}>
    <Outlet />
  </Container>
}

export default function Layout() {
  // const as = useStore(state => state.user?.as);
	// const navigate = useNavigate()
  // useEffect(() => {
  //   // FIXME only do after first load
  //   if (as) {navigate('/j')}
  // }, [as])
  // return <Box key={as}>

  return <>
    <Box>
      <AppBar />
      <Banner />
      <Container_ />
      <Footer inApp={true} />
    </Box>
    <UserListener />
    <SetupApi />
    {/*<SharingModal />*/}
    <EntryModal />
    <BehaviorsModal />
    <PremiumModal />
    <BooksModal />
    <AcknowledgeChecker />
    <Errors />
  </>
}
