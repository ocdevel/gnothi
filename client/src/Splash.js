import React from 'react'
import {Jumbotron, Button, Container, Row, Col} from 'react-bootstrap'
import {
  FaTextHeight,
  FaRobot,
  FaShare,
  FaLock,
  FaQuestion,
  FaCubes,
  FaBook,
  FaSmile,
} from 'react-icons/fa'
import { IoMdJournal} from "react-icons/io"
import Error from "./Error";
import {Auth, ResetPassword} from "./Auth"
import './Splash.css'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link, Redirect
} from "react-router-dom"
import {useSelector} from "react-redux"

export default function Splash() {
  const error = useSelector(state => state.error)
  return <Router>
    <Error message={error} />
    <Jumbotron className='gnothi-jumbo'>
      <div className='jumbo-content'>
        <div className='jumbo-text'>
          <h1>Gnothi</h1>
          <h4>Gnōthi Seauton: Know Thyself</h4>
          <p>A journal that uses AI to help you introspect and find resources</p>
          <Route exact path='/'>
            <Link to='/auth'>
              <Button>Sign In</Button>
            </Link>
          </Route>
        </div>
        <Switch>
          <Route path='/reset-password'>
            <div className='auth-block'>
              <ResetPassword />
            </div>
          </Route>
          <Route path='/auth'>
            <div className='auth-block'>
              <Auth />
            </div>
          </Route>
          <Redirect to="/" />
        </Switch>
      </div>
    </Jumbotron>
    <Container className='splash-features' fluid>
      <Row lg={3} sm={2} xs={1}>
        <Col>
          <h3><FaTextHeight /> Summaries</h3>
          <p>AI summarizes your entries, your week, your year.</p>
        </Col>
        <Col>
          <h3><FaCubes /> Themes</h3>
          <p>AI shows your recurring themes & issues. Also valuable for dream themes.</p>
        </Col>
        <Col>
          <h3><FaQuestion /> Questions</h3>
          <p>Ask AI anything about yourself. The answers and insights may surprise you.</p>
        </Col>
        <Col>
          <h3><FaBook /> Books</h3>
          <p>AI recommends self-help books based on your entries.</p>
        </Col>
        <Col>
          <h3><FaSmile /> Field Tracking</h3>
          <p>Track fields (mood, sleep, substance intake, etc). AI shows you how they interact and which ones to focus on.</p>
        </Col>
        <Col>
          <h3><FaShare /> Share</h3>
          <p>Share journals with therapists, who can use all these tools to catch up since your last session.</p>
        </Col>
        <Col>
          <h3><FaLock /> Security</h3>
          <p>All text is industry-standard encrypted.</p>
        </Col>
        <Col>
          <h3><FaRobot /> Future</h3>
          <p>The sky's the limit with <a target='_blank' href='https://huggingface.co/transformers/'>BERT</a> language models! Astrology? Dream analysis? </p>
        </Col>
      </Row>
    </Container></Router>
}
