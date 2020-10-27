import React, {useEffect, useState} from "react";
import {Link} from 'react-router-dom'
import Fields from "../Fields/Fields";
import {
  Accordion,
  Card,
  Alert
} from "react-bootstrap";
import {
  FaGithub,
  FaQuestionCircle,
  FaCouch,
  FaMap,
  FaBug,
  MdEmail,
  FaMicrophone,
  FaDragon, FaReddit, FaBalanceScale,
  FaBook, FaDollarSign
} from "react-icons/all";

import { useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'
import {FaAmazon} from "react-icons/fa";

function TopBooks() {
  const [books, setBooks] = useState([])
  const dispatch = useDispatch()

  const fetchBooks = async () => {
    const {data} = await dispatch(fetch_('top-books'))
    setBooks(data)
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  return <>
    <Alert variant='info'>To see books recommended to you based on your journal entries, go to <Link to='/resources'><FaBook /> Resources</Link>. Below are some (non-personalized) popular books in the community.</Alert>
    {books.map((b, i) => <div>
      <a href={b.amazon} target='_blank'>{b.title}</a> -{' '}
      <small className='text-muted'>
        {b.author} - {b.topic} -{' '}
        <FaAmazon /> Affiliate <a href='https://github.com/lefnire/gnothi/issues/47' target='_blank'>?</a>
      </small>
      {i < books.length-1 && <hr/>}
    </div>)}
  </>
}

export default function Sidebar() {

  return <>
    <Accordion defaultActiveKey="fields">
      <Card>
        <Accordion.Toggle as={Card.Header} variant="link" eventKey="fields">
          Fields
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="fields">
          <Card.Body>
            <Fields />
          </Card.Body>
        </Accordion.Collapse>
      </Card>

      <Card>
        <Accordion.Toggle as={Card.Header} variant="link" eventKey="links">
          Links
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="links">
          <Card.Body>
            <h5>Gnothi</h5>
            <ul className='list-unstyled'>
              <li>
                <FaCouch /> <a href="/about">About</a>{' '}
                <small className='text-muted'>Details about Gnothi's features</small>
              </li>
              <li>
                <FaQuestionCircle /> <a href="https://github.com/lefnire/gnothi/issues?q=label%3AFAQ" target='_blank'>FAQ</a>{' '}
                <small className='text-muted'>Frequently Asked Questions</small>
              </li>
              <li>
                <FaGithub /> <a href="https://github.com/lefnire/gnothi" target="_blank">Code</a>{' '}
                <small className='text-muted'>Gnothi is open source, hosted on Github</small>
              </li>
              <li>
                <FaMap /> <a href="https://github.com/lefnire/gnothi/projects/1" target="_blank">Roadmap</a>{' '}
                <small className='text-muted'>See what I'm working on now and in the future</small>
              </li>
              <li>
                <FaDollarSign /> <a href="https://github.com/lefnire/gnothi/issues/96" target="_blank">Support</a>{' '}
                <small className='text-muted'>How to support the project</small>
              </li>
            </ul>

            <h5>Feedback</h5>
            <ul className='list-unstyled'>
              <li>
                <FaBug /> <a href="https://github.com/lefnire/gnothi/issues/45" target="_blank">Bugs/Features</a>{' '}
                <small className='text-muted'>Submit bugs, feedback, and feature-requests as Github issues</small>
              </li>
              <li>
                <MdEmail /> <a href="mailto:tylerrenelle@gmail.com">Contact</a>{' '}
                <small className='text-muted'>Don't hesitate to email <a href="https://www.linkedin.com/in/lefnire/" target="_blank">me</a> for any reason</small>
              </li>
            </ul>

            <h5>Community</h5>
            <ul className='list-unstyled'>
              <li>
                <FaDragon /> <a href="https://habitica.com/groups/guild/71a86c2f-4d84-49cc-8802-3dd69731447b" target="_blank">Habitica Guild</a>{' '}
                <small className='text-muted'>Join our small Habitica guild, chat therapy / journaling / Gnothi</small>
              </li>
              <li>
                <FaReddit /> <a href="https://www.reddit.com/r/gnothi" target="_blank">Reddit</a>{' '}
                <small className='text-muted'>Chat Gnothi on Reddit, help me break the silence there</small>
              </li>
              <li>
                <FaMicrophone /> <a href="http://ocdevel.com/mlg" target="_blank">Podcast</a>{' '}
                <small className='text-muted'>Gnothi is a follow-along project on a podcast I run about AI</small>
              </li>
            </ul>

            <h5>Legal</h5>
            <ul className='list-unstyled'>
              <li>
                <FaBalanceScale /> <a href="/privacy">Privacy Policy</a>{' '}
                <small className='text-muted'>If you have questions/concerns, see <a href="https://github.com/lefnire/gnothi/issues/46" target="_blank">this FAQ</a></small>
              </li>
              <li>
                <FaBalanceScale /> <a href="/terms">Terms of Use</a>{' '}
                <small className='text-muted'>If you have questions/concerns, see <a href="https://github.com/lefnire/gnothi/issues/46" target="_blank">this FAQ</a></small>
              </li>
            </ul>

          </Card.Body>
        </Accordion.Collapse>
      </Card>

      <Card>
        <Accordion.Toggle as={Card.Header} variant="link" eventKey="books">
          Top Books
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="books">
          <Card.Body>
            <TopBooks />
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  </>
}
