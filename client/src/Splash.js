import React, {useState} from 'react'
import {Jumbotron, Button, Container, Row, Col} from 'react-bootstrap'
import {
  FaTextHeight,
  FaRobot,
  FaShare,
  FaQuestion,
  FaCubes,
  FaBook,
  FaSmile,
} from 'react-icons/fa'
import { IoMdJournal} from "react-icons/io"
import Error from "./Error";
import Auth from "./Auth";
import './Splash.css'

export default function Splash({serverError, onAuth, fetch_}) {
  const [showAuth, setShowAuth] = useState(false)

  return <>
    <Error message={serverError} />
    <Jumbotron className='gnothi-jumbo'>
      <div className='jumbo-content'>
        <div className='jumbo-text'>
          <h1>Gnothi</h1>
          <h4>Gnōthi Seauton: Know Thyself.</h4>
          <p>A journal that uses AI to help you introspect and find resources.</p>
          {!showAuth && <Button onClick={() => setShowAuth(true)}>Sign In</Button>}
        </div>
        {showAuth && (
          <div className='auth-block'>
            <Auth onAuth={onAuth} fetch_={fetch_} />
          </div>
        )}
      </div>
    </Jumbotron>
    <Container className='splash-features' fluid>
      <Row>
        <Col>
          <h3><FaTextHeight /> Summaries</h3>
          <p>AI summarizes your entries, your week, your year.</p>
        </Col>
        <Col>
          <h3><FaCubes /> Themes</h3>
          <p>AI shows you your recurring themes & issues. Also valuable for recurring dream themes.</p>
        </Col>
        <Col>
          <h3><FaQuestion /> Questions</h3>
          <p>Ask AI anything about yourself. The answers and insights may surprise you.</p>
        </Col>
      </Row>
      <Row>
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
      </Row>
    </Container></>
}
