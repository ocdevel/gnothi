import * as React from 'react';
import Box from '@mui/material/Box';

import {Route, Routes, useLocation, Outlet, useNavigate} from "react-router-dom";
import useApi from "@gnothi/web/src/data/api";
import {useStore} from "@gnothi/web/src/data/store";
import {useEffect, useCallback} from "react";
import Error from '@gnothi/web/src/ui/Components/Error'
import {Loading} from '@gnothi/web/src/ui/Components/Routing'

import {styles} from '../../Setup/Mui'

import Container from "@mui/material/Container";
import {ErrorSnack} from "../../Components/Error";
import GroupsToolbar from "../Groups/List/Toolbar"
import GroupToolbar from "../Groups/View/Toolbar"
import SharingModal from "../Sharing"
import EntryModal from "../Entries/Modal"
import BehaviorsModal from "../Behaviors/Modal"
import {shallow} from "zustand/shallow";
import AppBar from './AppBar'
import Footer from '../../Footer'
import {AcknowledgeChecker} from "../../Setup/Acknowledge.tsx";



// Have this separate since it'd otherwise cause a re-render after every lastJsonMessage, etc.
function SetupApi() {
  useApi()
  return null
}

function UserListener() {
  const setUser = useStore(useCallback(state => state.setUser, []))

  // listen to changes across, me, as, and users-list. Only set the viewer
  // when things needed are present.
  useEffect(() => {
    return useStore.subscribe(
      (state) => [
        state.user,
        state.res.users_list_response,
      ],
      ((state, prevState) => {
        // Note: editor having trouble with subscribeWithSelector typing, ignore errors
        const [user, users] = state
        // users list not available to set the viewer. Loading indicator elsewhere
        if (!users?.ids?.length) {return}
        if (!user.me) {
          const me = users.hash[users.ids[0]]
          setUser({me, viewer: me, as: null})
          return
        }
        // TODO handle as switch
        // if (viewer.asId && hash[viewer.asId]) {
        //   get().send('users_everything_request', {})
        // }
      }),
      // {equalityFn: shallow, fireImmediately: false}
    )
  }, [])
  return null
}

function Errors() {
  // const error = useStore(state => state.apiError);
  // <Error message={error} />
  // <Error codes={[422,401,500]} />
  return <ErrorSnack />
}

export default function Layout() {
  const as = useStore(state => state.user?.as);
  const user = useStore(state => state.user?.me)
	const navigate = useNavigate()

  // Disable left/right paddding for privacy, terms, disclaimer - since those pages add their own
  const {pathname} = useLocation()
  const disableGutters = ['/privacy', '/terms', '/disclaimre'].includes(pathname)
  // const disableGutters = false

  useEffect(() => {
    // FIXME only do after first load
    if (as) {navigate('/j')}
  }, [as])

  // Disabling this for now; should progressively load parts of the site. Make sure there's no hard dependencies
  // use anywhere! Use `store.user?.me?.id` kind of stuff.
  // if (!user) {
  //   return <Loading label="user" />
  // }


  // return <Box key={as}>
  return <>
    <Box>
      <AppBar />
      <Container maxWidth={false} disableGutters={disableGutters}>
        <Outlet />
      </Container>
      <Footer inApp={true} />
    </Box>


    <UserListener />
    <SetupApi />
    <SharingModal />
    <EntryModal />
    <BehaviorsModal />
    <AcknowledgeChecker />
    <Errors />
  </>
}
