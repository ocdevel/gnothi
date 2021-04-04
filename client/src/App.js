import React, {useState, useEffect, useRef} from 'react'
import Amplify, {Auth} from 'aws-amplify';

import '@aws-amplify/ui/dist/style.css'

import './App.scss'
import {
  Col,
  Container, Row,
  Spinner
} from 'react-bootstrap';
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
import {Sidebar} from './Navbar'
import Footer from './Footer'

import { StoreProvider, useStoreActions, useStoreState } from 'easy-peasy'
import store from './redux/store'
import {useSockets} from "./redux/ws";

import Insights from "./Insights";
import Tags, {MainTags} from "./Tags";
import Resources from "./Resources";
import {Entries} from "./Entries/Entries";
import Groups from "./Groups";
import staticRoutes from "./Static";
import _ from "lodash";
import moment from "moment-timezone";
import {SharingModal} from "./Account/Sharing";

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
    <Sidebar>
      <Container fluid style={{marginTop: 5}} className='app-content'>
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
      </Container>
    </Sidebar>
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
  <StoreProvider store={store}>
    <Router>
      <App />
      <Footer />
    </Router>
  </StoreProvider>
</>;
