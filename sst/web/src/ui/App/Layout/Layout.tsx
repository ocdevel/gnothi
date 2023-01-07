import * as React from 'react';
import Box from '@mui/material/Box';

import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {Loading} from '@gnothi/web/src/ui/Components/Routing'

import {styles} from '../../Setup/Mui'

import AppBar, {Link, CTA} from '../../Components/AppBar'
import Container from "@mui/material/Container";
import {ErrorSnack} from "../../Components/Error";
import GroupsToolbar from "../Groups/List/Toolbar"
import GroupToolbar from "../Groups/View/Toolbar"
import SharingModal from "../Account/Sharing"
import EntryModal from "../Entries/Modal"

function AppBar_() {
  const location = useLocation()
  const setSharePage = useStore(s => s.setSharePage)
  const setEntryModal = useStore(s => s.setEntryModal)

  const links: Link[] = [
    {name: "Journal", to: "/j", className: "button-journal"},
    {name: "Sharing", onClick: () => setSharePage({create: true}), className: "button-sharing"},
    // {name: "Groups", to: "/groups", className: "button-groups},
    {name: "Resources", to: "/", className: "button-resources"}
  ]

  const ctas: CTA[] =
    location.pathname.startsWith("/j") ? [{
      name: "New Entry",
      onClick: () => setEntryModal({mode: "new"}),
    }]
    : []

  return <AppBar
    clearBottom={true}
    links={links}
    ctas={ctas}
  />
  // return <>
  //   <Routes>
  //     <Route path='/groups/*' element={<S><GroupsToolbar /></S>} />
  //     <Route path='/groups/:gid' element={<S><GroupToolbar /></S>} />
  //   </Routes>
  // </>
}

// Have this separate since it'd otherwise cause a re-render after every lastJsonMessage, etc.
function SetupApi() {
  useApi()
  return null
}

function Errors() {
  const error = useStore(state => state.apiError);
  {/*<Error message={error} />*/}
  {/*<Error codes={[422,401,500]} />*/}
  return <ErrorSnack />
}

function Layout() {
  const as = useStore(state => state.user?.as);
  const user = useStore(state => state.user?.me)
	const navigate = useNavigate()

  useEffect(() => {
    // FIXME only do after first load
    if (as) {navigate('/j')}
  }, [as])

  if (!user) {
    return <Loading label="Loading user" />
  }

  // return <Box key={as}>
  return <Box>
    <SetupApi />
    <AppBar_ />
    <Container maxWidth={false}>
      <Outlet />
    </Container>
    <SharingModal />
    <EntryModal />
    <Errors />
  </Box>
}

export default function Wrapper() {
  return <>
    <SetupApi />
    <Layout />
  </>
}
