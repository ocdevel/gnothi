import React, {useState, useEffect, useRef} from 'react'
import CssBaseline from '@material-ui/core/CssBaseline';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import '@aws-amplify/ui/dist/style.css'

import './App.scss'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useHistory,
  useLocation,
  Link
} from "react-router-dom";
import Splash from './Splash'
import Account from './Account'
import Error from './Error'

import { StoreProvider, useStoreActions, useStoreState } from 'easy-peasy'
import store from './redux/store'
import {useSockets} from "./redux/ws";

import Insights from "./Insights";
import Tags, {MainTags} from "./Tags";
import Resources from "./Resources";
import Entries from "./Entries/Entries";
import Groups from "./Groups";
import staticRoutes from "./Static";
import {SharingModal} from "./Account/Sharing";
import Drawer from "./Navbar/Drawer";

function LoggedOut() {
  return <Switch>
    {staticRoutes()}
    <Route>
      <Splash />
    </Route>
    <Redirect from="/j" to="/" />
  </Switch>
}

function LoggedIn() {
  useSockets()
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(s => s.user.as);
  const error = useStoreState(state => state.server.error);
  const user = useStoreState(s => s.ws.data['users/user/get'])

	const history = useHistory()

  useEffect(() => {
    // FIXME only do after first load
    if (as) {history.push('/j')}
  }, [as])

  if (!user) {return null}

  // key={as} triggers refresh on these components (triggering fetches)
  return <div key={as}>
    <Drawer>
      <>
        <Error message={error} />
        <Error codes={[422,401,500]} />

        <Switch>
          <Route path='/about'>
            <Splash />
          </Route>
          <Route path="/j">
            <Entries />
          </Route>
          <Route path="/insights">
            {MainTags}
            <Insights />
          </Route>
          <Route path="/resources">
            <Resources />
          </Route>
          <Route path="/account">
            <Account />
          </Route>
          <Route path="/groups">
            <Groups />
          </Route>
          {staticRoutes()}
          <Redirect from="/" to="/j" />
        </Switch>
      </>
    </Drawer>
    <SharingModal />
  </div>
}

function App() {
  const jwt = useStoreState(state => state.user.jwt);
  const checkJwt = useStoreActions(a => a.user.checkJwt)
  const location = useLocation()

  useEffect(() => {checkJwt()}, [])
  useEffect(() => {
    const search = new URLSearchParams(location.search)
    const code = search.get("code")
    if (code) {
      window.localStorage.setItem("affiliate", code)
    }
  }, [])

  if (!jwt) return <LoggedOut />
  return <LoggedIn />
}

export default () => <>
  <StyledEngineProvider injectFirst>
    <CssBaseline />
    <StoreProvider store={store}>
      <Router>
        <App />
      </Router>
    </StoreProvider>
  </StyledEngineProvider>
</>;
