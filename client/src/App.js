import React, { useState, useEffect } from 'react'
import './App.css'
import {
  Col,
  Container, Row,
} from 'react-bootstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useHistory,
  useLocation
} from "react-router-dom";
import Splash from './Splash'
import ProfileRoutes from './ProfileRoutes'
import Error from './Error'
import MainNav from './MainNav'

import { Provider, useSelector, useDispatch } from 'react-redux'
import store from './redux/store';
import {
  getUser,
  checkAiStatus,
  getEntries,
  setSelectedTags,
  getTags,
  getFields
} from './redux/actions';
import Summarize from "./Summarize";
import Tags from "./Tags";
import {SimplePopover} from "./utils";
import {FaTags} from "react-icons/fa/index";
import Query from "./Query";
import Themes from "./Themes";
import Resources from "./Books";
import Entries from "./Entries";
import Fields from "./Fields";
import {NotesAll} from "./Notes";


function App() {
  const jwt = useSelector(state => state.jwt);
  const user = useSelector(state => state.user);
  const as = useSelector(state => state.as);
  const serverError = useSelector(state => state.serverError);
	const dispatch = useDispatch();
	const history = useHistory()
  const location = useLocation()

  useEffect(() => {
    // FIXME only do after first load
    if (as) {history.push('/j')}
  }, [as])

  useEffect(() => {
    dispatch(getUser())
    dispatch(setSelectedTags({}))
    dispatch(getTags())
    dispatch(getEntries())
    dispatch(getFields())

    // TODO move to websockets
    const timer = setInterval(() => dispatch(checkAiStatus()), 1000)
    return () => clearInterval(timer)
  }, [jwt, as])

  if (!user) {
    return <Splash />
  }

  const renderTags = () => {
    if (location.pathname === '/resources') {return null}
    return (
      <div>
        <SimplePopover text="Tags">
          <FaTags/>
        </SimplePopover>
        <span className='tools-divider'/>
        {/*TODO reconsider preSelectMain for !!as. Eg, currently don't want therapist seeing Dream by default.*/}
        <Tags preSelectMain={true} />
      </div>
    )
  }

  // key={as} triggers refresh on these components (triggering fetches)
  return <div key={as}>
    <MainNav />
    <Container fluid style={{marginTop: 5}}>
      {renderTags()}
      <Error message={serverError} />

        <Switch>
          <Route path="/j">
            <Row>
              <Col>
                <Entries />
              </Col>
              <Col lg={4}>
                <Fields  />
                <NotesAll />
              </Col>
            </Row>
          </Route>
          <Route path="/summarize">
            <Summarize />
          </Route>
          <Route path="/ask">
            <Query />
          </Route>
          <Route path="/themes">
            <Themes />
          </Route>
          <Route path="/resources">
            <Resources />
          </Route>
          <Route path="/profile">
            <ProfileRoutes />
          </Route>
          <Redirect from="/" to="/j" />
        </Switch>

    </Container>
  </div>
}

export default () => <>
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
</>;
