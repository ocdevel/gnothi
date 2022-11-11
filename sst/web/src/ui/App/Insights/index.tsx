
import Summarize from "./Summarize"
import Ask from "./Ask"
import Themes from "./Themes"
import {
  FaCubes,
  FaQuestion,
  FaTags,
  FaTextHeight,
  FaLock
} from "react-icons/fa"
import React, {useState} from "react"
import {useStore} from "@gnothi/web/src/data/store"
// import {aiStatusEmoji} from "@gnothi/web/src/utils/utils"
import _ from 'lodash'
import Alert from '@mui/material/Alert'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CalendarToday from "@mui/icons-material/CalendarToday";
import {Alert2, ToolbarHeader} from "@gnothi/web/src/ui/Components/Misc";
import {Link} from "react-router-dom";
import Button from "@mui/material/Button";

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
  const days = useStore(s => s.insights.days)
  const entries = useStore(s => s.res.entries_list_response)
  const setDays = useStore(actions => actions.setDays)

  const ne = entries?.rows?.length || 0
  const nTools = _.reduce(tools, (m,v,k) => {
    return m + (ne >= v.minEntries ? 1 : 0)
  }, 0)

  const changeDays = (e: React.SyntheticEvent, val: number) => {
    setDays(e.target.value)
  }

  const renderDaysForm = () => <>
    <TextField
      sx={{mt:2}}
      label="Number of days"
      min={1}
      type="number"
      value={days}
      onChange={changeDays}
      helperText="Number of days' worth of entries (from today) to include. Eg, 7 if you're checking weekly."
      InputProps={{
        startAdornment: <InputAdornment position="start"><CalendarToday /></InputAdornment>,
      }}
    />
  </>

  return <>
    {renderDaysForm()}
    <Alert2
      severity='info'
      title='Tools use AI for insights on your entries.'
    >
      <div>Limit which entries are processed by choosing <FaTags /> tags and <code>#Days</code> above.</div>
      {nTools < 3 && nTools > 0 && <div>
        <FaLock /> More AI tools unlock as you add entries
      </div>}
    </Alert2>

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
              {t.component}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </>

}
