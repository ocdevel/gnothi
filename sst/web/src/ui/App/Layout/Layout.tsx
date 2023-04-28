import * as React from 'react';
import Box from '@mui/material/Box';

import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect, useCallback} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {Loading} from '@gnothi/web/src/ui/Components/Routing'

import {styles} from '../../Setup/Mui'

import AppBar, {Link, CTA} from '../../Components/AppBar'
import Container from "@mui/material/Container";
import {ErrorSnack} from "../../Components/Error";
import GroupsToolbar from "../Groups/List/Toolbar"
import GroupToolbar from "../Groups/View/Toolbar"
import SharingModal from "../Sharing"
import EntryModal from "../Entries/Modal"
import BehaviorsModal from "../Behaviors/Modal"
import shallow from "zustand/shallow";

function AppBar_() {
  const location = useLocation()
  const [
    setShareView,
    setEntryModal,
  ] = useStore(s => [
    s.sharing.setView,
    s.setEntryModal,
  ], shallow)

  const clickSharing = useCallback(() => {
    setShareView({tab: "inbound", outbound: "new", sid: null})
  }, [])
  const clickEntry = useCallback(() => {
    setEntryModal({mode: "new"})
  }, [])

  const links: Link[] = [
    {name: "Journal", to: "/j", className: "btn-journal"},
    {name: "Sharing", onClick: clickSharing, className: "btn-sharing"},
    // {name: "Groups", to: "/groups", className: "btn-groups},
    {name: "Resources", to: "/", className: "btn-resources"}
  ]

  const ctas: CTA[] =
    location.pathname.startsWith("/j") ? [{
      name: "New Entry",
      onClick: clickEntry,
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
    return <Loading label="user" />
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
    <BehaviorsModal />
    <Errors />
  </Box>
}

export default function Wrapper() {
  return <>
    <SetupApi />
    <Layout />
  </>
}
