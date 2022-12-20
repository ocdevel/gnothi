import * as React from 'react';
import Box from '@mui/material/Box';

import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {S, Loading} from '@gnothi/web/src/ui/Components/Routing'

import {styles} from '../../Setup/Mui'

import AppBar from '../../Components/AppBar'
const GroupsToolbar = React.lazy(() => import ("../Groups/List/Toolbar"))
const GroupToolbar = React.lazy(() => import ("../Groups/View/Toolbar"))
const SharingModal = React.lazy(() => import("../Account/Sharing"))
const EntryModal = React.lazy(() => import("../Entries/Modal"))

function AppBar_() {
  const location = useLocation()
  const setSharePage = useStore(a => a.setSharePage)

  const cta = location.pathname === "/j" ? {name: "New Entry", onClick: () => {alert("new entry")}}
    : {}

  return <AppBar
    clearBottom={true}
    links={[
      {name: "Journal", to: "/j"},
      {name: "Sharing", onClick: () => setSharePage({create: true})},
      // {name: "Groups", to: "/groups"},
      {name: "Resources", to: "/"}
    ]}
    ctas={[cta]}
  />
  // return <>
  //   <Routes>
  //     <Route path='/groups/*' element={<S><GroupsToolbar /></S>} />
  //     <Route path='/groups/:gid' element={<S><GroupToolbar /></S>} />
  //   </Routes>
  // </>
}

export default function Layout() {
  useApi()
  const as = useStore(state => state.user?.as);
  const error = useStore(state => state.apiError);
  const user = useStore(state => state.user?.me)
	const navigate = useNavigate()


  useEffect(() => {
    // FIXME only do after first load
    if (as) {navigate('/j')}
  }, [as])

  if (!user) {
    return <Loading label="Loading user" />
  }

  return <Box key={as}>
    <AppBar_ />
    {/* TODO put these in drawer */}
    <Error message={error} />
    <Error codes={[422,401,500]} />
    <Outlet />
    <S><SharingModal /></S>
    <S><EntryModal /></S>
  </Box>
}
