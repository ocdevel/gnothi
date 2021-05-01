import {
  Form,
  Row, Col,
  InputGroup,
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
import {aiStatusEmoji} from "../Helpers/utils"
import _ from 'lodash'
import {Alert, CardContent, CardHeader, Typography} from '@material-ui/core'
import {Card, Grid} from '@material-ui/core'

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
  const entries = useStoreState(s => s.ws.data['entries/entries/get'])
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)
  const setDays = useStoreActions(actions => actions.insights.setDays)

  const ne = entries?.arr?.length
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
    return <Alert severity='warning' sx={{my:2}}>
      <div>
        {aiStatusEmoji(aiStatus)} Can't use tools yet, AI waking up. Check back in 3.
      </div>
      <small class='text-muted'>
        The AI-based features require expensive servers. I have them turned off when nobody's using the site, and on when someone's back. It takes about 3 minutes to wake. The status {aiStatusEmoji(aiStatus)} icon is always visible top-left of website.
      </small>
    </Alert>
  }

  return <>
    {renderDaysForm()}
    <Alert severity='info' sx={{my:2}}>
      <div>Tools use AI for insights on your entries.</div>
      <small className='text-muted'>
        <div>Limit which entries are processed by choosing <FaTags /> tags and <code>#Days</code> above.</div>
        {nTools < 3 && nTools > 0 && <div>
          <FaLock /> More AI tools unlock as you add entries
        </div>}
      </small>
    </Alert>

    {renderStatus()}

    {nTools === 0 && <Alert severity='warning' sx={{my:2}}>
      <FaLock /> You don't have any entries to work with, come back later
    </Alert>}
    <Grid container spacing={2}>
      {tools.map(t => ne >= t.minEntries && (
        <Grid item xs lg={12 / nTools}>
          <Card className='mb-3'>
            <CardHeader
              title={<>{t.icon} {t.label}</>}
              subtitle={t.description}
            />
            <CardContent>
              <Typography>{t.component}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </>

}
