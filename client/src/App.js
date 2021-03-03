import React, { useState, useEffect } from 'react'
import './App.scss'
import {
  Container,
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
  const jwt = useStoreState(state => state.user.jwt);
  const as = useStoreState(state => state.user.as);
  const error = useStoreState(state => state.server.error);
	const getUser = useStoreActions(actions => actions.user.getUser)
	const getTags = useStoreActions(actions => actions.j.getTags)
	const getEntries = useStoreActions(actions => actions.j.getEntries)
	const getFields = useStoreActions(actions => actions.j.getFields)

	const history = useHistory()
  useSockets()

  useEffect(() => {
    // FIXME only do after first load
    if (as) {history.push('/j')}
  }, [as])

  useEffect(() => {
    getUser()
    getTags()
    getEntries()
    getFields()
  }, [jwt, as])

  // key={as} triggers refresh on these components (triggering fetches)
  return <div key={as}>
    <MainNav />
    <Container fluid style={{marginTop: 5}}>
      <Error message={error} />

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
  const getUser = useStoreActions(actions => actions.user.getUser)
  const user = useStoreState(state => state.user.user);

  useEffect(() => {
    if (!jwt) { return }
    getUser()
  }, [jwt])

  if (!user) return <LoggedOut />
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
