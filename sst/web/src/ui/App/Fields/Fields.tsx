import React, {useEffect, useState, useCallback} from "react";
// import {API_URL} from '../redux/ws'
import _ from "lodash";
import ReactStars from "react-stars";
import SetupHabitica from "./SetupHabitica";
import FieldModal from "./FieldModal";
import ChartModal from "./ChartModal";
import {FieldName} from "./utils";

import {useStore} from "@gnothi/web/src/data/store"

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button, {ButtonProps} from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ButtonGroup from "@mui/material/ButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import ButtonBase from "@mui/material/ButtonBase";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import BarChart from "@mui/icons-material/BarChart";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {Checkbox2} from "@gnothi/web/src/ui/Components/Form";
import {Alert2} from "@gnothi/web/src/ui/Components/Misc";
import Box from "@mui/material/Box";
import Advanced from "./Advanced";
import DayChanger from './DayChanger'
import * as S from '@gnothi/schemas'
import {useFieldsStore} from './store'
import shallow from 'zustand/shallow'

export default function Fields() {
  const send = useStore(s => s.send)
  const user = useStore(s => s.user)
  const fields = useStore(state => state.res.fields_list_response)
  const fieldEntries = useStore(s => s.res.fields_entries_list_response?.hash)
  const fieldValues = useStore(s => s.fieldValues)
  const setFieldValues = useStore(a => a.setFieldValue)
  const syncRes = useStore(s => s.res.habitica_sync_response?.res)

  const [day, isToday, setShowForm, setShowChart] = useFieldsStore(s => [
    s.day, s.isToday, s.setShowForm, s.setShowChart
  ], shallow)

  // having lots of trouble refreshing certain things, esp. dupes list after picking. Force it for now
  const [cacheBust, setCacheBust] = useState(+new Date)

  const {as, viewer, me} = user

  useEffect(() => {
    fetchFieldEntries()
  }, [fields, day])

  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  // https://www.freecodecamp.org/news/debounce-and-throttle-in-react-with-hooks/
  // TODO should I be using useRef instead of useCallback? (see link)
  const postFieldVal = React.useMemo(() =>
    _.debounce(postFieldVal_, 100),
    [day] // re-initialize with day-change
  )

  if (fields?.res?.error && fields.res.code === 403) {
    return <h5>{fields.res.data}</h5>
  }

  async function fetchFieldEntries() {
    if (_.isEmpty(fields)) {return}
    send('fields_entries_list_request', {day})
  }

  async function postFieldVal_(fid: string, value: string) {
    if (value === "") {return}
    send(`fields_entries_post_request`, {
      field_id: fid,
      value: parseFloat(value), // until we support strings,
      day: isToday ? undefined : day
    })
  }

  const fetchService = async (service: string) => {
    send('habitica_sync_request', {})
  }

  const changeFieldVal = (fid: string, direct=false) => e => {
    let value = direct ? e : e.target.value
    setFieldValues({[fid]: value})
    postFieldVal(fid, value)
  }

  const changeCheck = (fid: string) => (e: React.SyntheticEvent<HTMLInputElement>) => {
    changeFieldVal(fid, true)(~~!fieldValues[fid])
  }

  const renderSyncButton = (service: string) => {
    if (!~['habitica'].indexOf(service)) {return null}
    if (as) {return null}
    if (!me.habitica_user_id) {return null}
    if (syncRes?.sending) {return <CircularProgress />}
    return <>
      <Tooltip title='Gnothi auto-syncs every hour'>
        <Button sx={{mb:2}} size='small' variant='contained' onClick={() => fetchService(service)}>Sync</Button>
      </Tooltip>
    </>
  }

  const renderFieldEntry = (f, fe) => {
    const v = fieldValues[f.id]
    if (f.type === 'fivestar') return <>
      <ReactStars
        value={v || 0}
        half={false}
        size={25}
        onChange={changeFieldVal(f.id, true)}
      />
    </>
    if (f.type === 'check') return <div>
      <FormControlLabel
        label={<Typography variant='body2'>Yes</Typography>}
        control={<Radio
          size='small'
          checked={v > 0}
          onChange={changeCheck(f.id)}
        />}
      />
      <FormControlLabel
        label={<Typography variant='body2'>No</Typography>}
        control={<Radio
          checked={v < 1}
          size='small'
          onChange={changeCheck(f.id)}
        />}
      />
    </div>
    return <>
      <TextField
        disabled={!!f.service && isToday}
        type='number'
        size="small"
        value={v || 0}
        onChange={changeFieldVal(f.id)}
      />
    </>
  }


  const renderField = (f) => {
    // let rowStyle = {width: '100%', margin: 0}
    let rowStyle = {
      alignItems: 'center',
      justifyContent: 'space-between',
      mb: 1
    }
    if (f.excluded_at) {
      rowStyle = {
        ...rowStyle,
        textDecoration: 'line-through',
        opacity: .5
      }
    }
    const fe = fieldEntries?.[f.id] || {}
    return (
      <Grid
        className="fields-field"
        container
        sx={rowStyle}
        key={`${f.id}-${cacheBust}`}
      >
        <Grid item xs={5} className='field-name'>
          <ButtonBase
            sx={{width:'100%', justifyContent: 'flex-start'}}
            onClick={() => setShowForm(f.id)}
          >
            <FieldName name={f.name}/>
          </ButtonBase>
        </Grid>

        <Grid item xs={5}>
          {renderFieldEntry(f, fe)}
        </Grid>

        <Grid container item xs={2} justifyContent='flex-end'>
          <Badge 
            badgeContent={f.avg && f.avg.toFixed(1)}
            onClick={() => setShowChart(f.id)}
            sx={{cursor: 'pointer'}}
          >
            <BarChart />
          </Badge>
        </Grid>
      </Grid>
    )
  }

  // see 3b92a768 for dynamic field groups. Revisit when more than one service,
  // currently just habitica
  const groups = [{
    service: 'custom',
    name: 'Custom',
    fields: _(fields?.rows)
      .filter(v => !v.service && !v.excluded_at)
      .sortBy('id').value(),
    emptyText: () => <small className='text-muted'>
      <Box>Fields are activity & quality trackers. Mood, sleep, substance, habits, etc. They can be numbers, checkboxes, or fivestar-ratings.<ul>
        <li>Track your mood, sleep patterns, substance intake, etc</li>
        <li>See stats (average, graphs, predictions)</li>
        <li>See how fields interact: correlation. Eg, "sleep most influenced by alcohol".</li>
        <li>Help long-term decisions by tracking options (fivestar-rate different jobs or moving destinations).</li>
        <li>Share fields, eg with a therapist who's interested in your mood or substances.</li>
        <li>For habits specifically, I recommend Habitica (below).</li>
      </ul></Box>
    </small>
  }, {
    service: 'habitica',
    name: 'Habitica',
    fields: _(fields?.rows)
      .filter(v => v.service === 'habitica' && !v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <small className='text-muted'>
      <p>For habit-tracking (exercise, substance, productivity, etc) I recommend <a href='FIXME' target='_blank'>Habitica</a>. Gnothi will sync Habitica habits & dailies.</p>
      <p>Use Gnothi fields for qualitative data (mood, sleep-quality, decisions) and Habitica for habits. Habitica doesn't support arbitrary number entries.</p>
      <p>Your UserID and API Token are database-encrypted. <em>All</em> sensitive data in Gnothi is encrypted.</p>
    </small>
  }, {
    service: 'excluded',
    name: 'Excluded',
    fields: _(fields?.rows)
      .filter(v => !!v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <small className='text-muted'>
      <p>If you stop tracking a field, but keep it around just in case, click "Remove" and it will show up here.</p>
    </small>
  }, {
    service: 'advanced',
    name: 'Advanced',
    fields: [],
    emptyText: () => <Advanced fetchFieldEntries={fetchFieldEntries} />
  }]

  const renderButtons = g => {
    if (g.service === 'custom') {
      return <Grid container justifyContent='space-around'>
        {!as && <Button
          className="button-fields-field-new"
          color="primary"
          variant="contained"
          size="small"
          onClick={() => setShowForm("new")}
        >New Field</Button>}
        {!!g.fields.length && <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => setShowChart("overall")}
        >Top Influencers</Button>}
      </Grid>
    }
    if (g.service === 'habitica' && !as) {
      return <SetupHabitica />
    }
    return null
  }

  const renderGroup = g => (
    <Accordion key={g.service} defaultExpanded={g.service === "custom"}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography>{g.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {g.fields.length ? g.fields.map(renderField) : g.emptyText()}
        {renderSyncButton(g.service)}
        {renderButtons(g)}
      </AccordionDetails>
    </Accordion>
  )


  function renderFields() {
    return <div className="sidebar-fields">
      {groups.map(renderGroup)}
    </div>

  }

  return <>
    <Card>
      <Grid container justifyContent='space-between'>
        <Grid item>
          <CardHeader title="Fields" />
        </Grid>
        <Grid item>
          <DayChanger />
        </Grid>
      </Grid>
      <CardContent>
        {renderFields()}
      </CardContent>
    </Card>
    {<FieldModal />}
    {<ChartModal />}
  </>
}
