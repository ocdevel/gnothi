import React, {useState, useEffect, useRef} from 'react'
import Amplify, {Auth} from 'aws-amplify';

import '@aws-amplify/ui/dist/style.css'

import './App.scss'
import {
  Container,
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
import MainNav from './MainNav'
import Footer from './Footer'

import { StoreProvider, useStoreActions, useStoreState } from 'easy-peasy'
import store from './redux/store'
import {useSockets} from "./redux/ws";

import Insights from "./Insights";
import Tags, {MainTags} from "./Tags";
import Resources from "./Resources";
import Entries from "./Entries/Entries";
import Groups from "./Groups";
import staticRoutes from "./Static";
import _ from "lodash";
import moment from "moment-timezone";

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
  const as = useStoreState(s => s.ws.as);
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
    <MainNav />
    <Container fluid style={{marginTop: 5}}>
      <Error message={error} />
      <Error codeRange={[400,500]} />

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
  </div>
}

function App() {
  const jwt = useStoreState(state => state.user.jwt);
  const setJwt = useStoreActions(actions => actions.user.setJwt);

  useEffect(() => {
    Auth.currentSession().then(res => {
      const jwt = _.get(res, "accessToken.jwtToken")
      if (jwt) {setJwt(jwt)}
    })
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
