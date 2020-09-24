import React, { useState, useEffect } from 'react'
import './App.css'
import {
  Container,
} from 'react-bootstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useHistory
} from "react-router-dom";
import Splash from './Splash'
import Journal from './Journal'
import ProfileRoutes from './ProfileRoutes'
import Error from './Error'
import MainNav from './MainNav'

import { Provider, useSelector, useDispatch } from 'react-redux'
import store from './redux/store';
import { getUser, checkAiStatus } from './redux/actions';


function App() {
  const jwt = useSelector(state => state.jwt);
  const user = useSelector(state => state.user);
  const as = useSelector(state => state.as);
  const serverError = useSelector(state => state.serverError);
	const dispatch = useDispatch();
	const history = useHistory()

  useEffect(() => {
    history.push('/j')
  }, [as])

  useEffect(() => {
    dispatch(getUser())

    // TODO move to websockets
    const timer = setInterval(() => dispatch(checkAiStatus()), 1000)
    return () => clearInterval(timer)
  }, [jwt, as])

  if (!user) {
    return <Splash />
  }

  // key={as} triggers refresh on these components (triggering fetches)
  return <>
    <MainNav />
    <Container fluid key={as}>
      <Error message={serverError} />
      <Switch>
        <Route path="/j">
          <Journal />
        </Route>
        <Route path="/profile">
          <ProfileRoutes />
        </Route>
        <Redirect from="/" to="/j" />
      </Switch>
    </Container>
  </>
}

export default () => <>
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
</>;
