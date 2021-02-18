import {
  Row,
  Col,
  Form,
  InputGroup,
  Card,
  Alert
} from 'react-bootstrap'
import Summarize from "./Summarize"
import Ask from "./Ask"
import Themes from "./Themes"
import {
  FaCubes,
  FaQuestion,
  FaTags,
  FaTextHeight,
  FaLock
} from "react-icons/fa/index"
import React, {useState} from "react"
import {useStoreState, useStoreActions} from "easy-peasy";
import {aiStatusEmoji} from "../utils"
import _ from 'lodash'

const tools = [
  {
    minEntries: 1,
    label: "Summarize",
    icon: <FaTextHeight />,
    component: <Summarize />,
    description: `Summarize your entries for an overview.`,
  },
  {
    minEntries: 4,
    label: "Themes",
    icon: <FaCubes />,
    component: <Themes />,
    description: `Show common recurring themes across your entries.`,
  },
  {
    minEntries: 2,
    label: "Ask",
    icon: <FaQuestion />,
    component: <Ask />,
    description: `Ask a question about your entries.`,
  },
  // 62da7182: books attrs, popovers
]

export default function Insights() {
  const days = useStoreState(state => state.insights.days)
  const entries = useStoreState(state => state.j.entries)
  const aiStatus = useStoreState(state => state.server.ai)
  const setDays = useStoreActions(actions => actions.insights.setDays)

  const ne = entries.length
  const nTools = _.reduce(tools, (m,v,k) => {
    return m + (ne >= v.minEntries ? 1 : 0)
  }, 0)

  const changeDays = e => {
    setDays(e.target.value)
  }

  const renderDaysForm = () => <>
    <Form.Row>
      <Form.Group as={Col} lg={6}>
        <Form.Label for={`xDays`} srOnly>Number of days</Form.Label>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>#Days</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            id={`xDays`}
            type="number"
            min={1}
            value={days}
            onChange={changeDays}
          />
        </InputGroup>
        <Form.Text muted>
          Number of days' worth of entries (from today) to include. Eg, 7 if you're checking weekly.
        </Form.Text>
      </Form.Group>
    </Form.Row>
  </>

  const renderStatus = () => {
    if (aiStatus === 'on') {return null}
    return <Alert variant='warning'>
      <div>
        {aiStatusEmoji(aiStatus)} Can't use tools yet, AI waking up. Check back in 3.
      </div>
      <small class='text-muted'>
        The AI-based features require expensive servers. I have them turned off when nobody's using the site, and on when someone's back. It takes about 3 minutes to wake. The status {aiStatusEmoji(aiStatus)} icon is always visible top-left of website.
      </small>
    </Alert>
  }

  const lg = Math.min(3, nTools) || 1
  return <>
    {renderDaysForm()}
    <Alert variant='info'>
      <div>Tools use AI for insights on your entries.</div>
      <small className='text-muted'>
        <div>Limit which entries are processed by choosing <FaTags /> tags and <code>#Days</code> above.</div>
        {nTools < 3 && nTools > 0 && <div>
          <FaLock /> More AI tools unlock as you add entries
        </div>}
      </small>
    </Alert>

    {renderStatus()}

    {nTools === 0 && <Alert variant='warning'>
      <FaLock /> You don't have any entries to work with, come back later
    </Alert>}
    <Row lg={lg} md={1} sm={1} xs={1}>
      {tools.map(t => ne >= t.minEntries && (
        <Col>
          <Card className='mb-3'>
            <Card.Body>
              <Card.Title>{t.icon} {t.label}</Card.Title>
              <Card.Subtitle className='mb-3'>{t.description}</Card.Subtitle>
              <Card.Text>{t.component}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </>

}
