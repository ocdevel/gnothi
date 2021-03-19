import React, {useState, useEffect, useRef} from 'react'
import Amplify from 'aws-amplify';
import {AmplifyAuthenticator, AmplifySignOut, AmplifySignUp, AmplifySignIn} from "@aws-amplify/ui-react";
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import _ from 'lodash'


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
import axios from "axios";
import {API_URL, refreshToken} from "./redux/server";

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
  const getUser = useStoreActions(actions => actions.user.getUser)
  const as = useStoreState(state => state.user.as);
  const error = useStoreState(state => state.server.error);
	const getTags = useStoreActions(actions => actions.j.getTags)
	const getEntries = useStoreActions(actions => actions.j.getEntries)
	const getFields = useStoreActions(actions => actions.j.getFields)

	const history = useHistory()

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

function WaitForSetup() {
  useSockets()
  const socketReady = useStoreState(actions => actions.ws.ready)
  const getUser = useStoreActions(actions => actions.user.getUser)
  const user = useStoreState(actions => actions.user.user)

  useEffect(() => {
    if (!socketReady) {return}
    getUser()
  }, [socketReady])

  return user ? <LoggedIn /> : null
}

Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: "us-east-1",
    userPoolId: "us-east-1_Tsww98VBH",
    userPoolWebClientId: "5rh3bkhtmcskqer9t17gg5fn65"
  },
});

async function checkJwt(jwt) {
  const obj = {
    url: "http://localhost:5002/cognito",
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    data: {jwt}
  }
  const res = await axios(obj)
  debugger
}

const AuthStateApp = () => {
  const setJwt = useStoreActions(actions => actions.user.setJwt)
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      console.log('nextAuthState', nextAuthState)
      console.log('authData', authData)
      setAuthState(nextAuthState);
      setUser(authData)
      const jwt = _.get(authData, "signInUserSession.accessToken.jwtToken")
      // checkJwt(jwt)
      // setJwt(jwt)
    });
  }, []);

  // const mySubmit = async (a,b,c,d) => {
  //   const form = ref.current
  //   debugger
  // }

  return authState === AuthState.SignedIn && user ? (
    <div className="App">
      <div>Hello, {user.username}</div>
      <AmplifySignOut />
    </div>
    ) : (
    <AmplifyAuthenticator usernameAlias="email">
      <AmplifySignUp
        slot="sign-up"
        usernameAlias="email"
        formFields={[
          {
            type: "email",
            label: "Email",
            placeholder: "Enter your email address",
            required: true,
          },
          {
            type: "password",
            label: "Password",
            placeholder: "Enter your password",
            required: true,
          },
          // {
          //   type: "phone_number",
          //   label: "Custom Phone Label",
          //   placeholder: "custom Phone placeholder",
          //   required: false,
          // },
        ]}
      />
      <AmplifySignIn
        slot="sign-in"
        usernameAlias="email"
      />
    </AmplifyAuthenticator>
  );
}

function App() {
  const jwt = useStoreState(state => state.user.jwt);
  if (!jwt) return <AuthStateApp />
  return <WaitForSetup />
}

export default () => <>
  <StoreProvider store={store}>
    <Router>
      <App />
      <Footer />
    </Router>
  </StoreProvider>
</>;
