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
  useLocation,
  Link
} from "react-router-dom";
import Splash from './Splash'
import Account from './Account'
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
import Insights from "./Insights";
import Tags from "./Tags";
import {SimplePopover} from "./utils";
import {FaTags} from "react-icons/fa/index";
import Resources from "./Resources";
import Entries from "./Entries/Entries";
import Fields from "./Fields/Fields";
import staticRoutes from "./Static";
import {NotesAll} from "./Entries/Notes";

function Footer () {
  // TODO figure this out, https://www.freecodecamp.org/news/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/
  return <div id='footer'>
    <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}&#183;{' '}
    <Link to='/privacy'>Privacy Policy</Link>{' '}&#183;{' '}
    <Link to='/terms'>Terms of Use</Link>
  </div>
}

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
    return <Switch>
      {staticRoutes()}
      <Route>
        <Splash />
      </Route>
      <Redirect from="/j" to="/" />
    </Switch>
  }

  const tagsComp = (
    <div className='bottom-margin'>
      <SimplePopover text="Tags">
        <FaTags/>
      </SimplePopover>
      <span className='tools-divider'/>
      {/*TODO reconsider preSelectMain for !!as. Eg, currently don't want therapist seeing Dream by default.*/}
      <Tags preSelectMain={true} />
    </div>
  )

  // key={as} triggers refresh on these components (triggering fetches)
  return <div key={as}>
    <MainNav />
    <Container fluid style={{marginTop: 5}}>
      <Error message={serverError} />

      <Switch>
        <Route path="/j">
          <Row>
            <Col>
              {tagsComp}
              <Entries />
            </Col>
            <Col lg={4}>
              <Fields  />
              <NotesAll />
            </Col>
          </Row>
        </Route>
        <Route path="/insights">
          {tagsComp}
          <Insights />
        </Route>
        <Route path="/resources">
          <Resources />
        </Route>
        <Route path="/account">
          <Account />
        </Route>
        {staticRoutes()}
        <Redirect from="/" to="/j" />
      </Switch>

    </Container>
  </div>
}

export default () => <>
  <Provider store={store}>
    <Router>
      <App />
      <Footer />
    </Router>
  </Provider>
</>;
