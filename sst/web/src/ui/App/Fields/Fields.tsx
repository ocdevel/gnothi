import React, {useEffect, useState, useCallback} from "react";
// import {API_URL} from '../redux/ws'
import _ from "lodash";
import ReactStars from "react-stars";
import SetupHabitica from "./SetupHabitica";
import FieldModal from "./FieldModal";
import ChartModal from "./ChartModal";
import {FieldName} from "./utils";
import moment from 'moment'

import {useStore} from "@gnothi/web/src/data/store"
import {
  FaArrowLeft,
  FaArrowRight,
  FaExclamationTriangle,
  FaRegCalendarAlt
} from "react-icons/fa";
import axios from "axios";
import fileDownload from 'js-file-download';
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from "@mui/material/Button";
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

const fmt = 'YYYY-MM-DD'
const iso = (day=null) => {
  const m = day ? moment(day) : moment()
  return m.format(fmt)
}

type DayChanger = {
  day: string,
  setDay: (day: string) => void,
  isToday: boolean,
}
function DayChanger({day, setDay, isToday}: DayChanger) {
  const changeDay = (dir: 1 | -1) => {
    if (dir === -1 ) {
      setDay(moment(day).subtract(1, 'day').format(fmt))
    } else {
      setDay(moment(day).add(1, 'day').format(fmt))
    }
  }

  return <Grid
    container
    alignItems='center'
    direction='column'
    sx={{mt: 1, mr: 3 }}
  >
    <Grid item>
      <ButtonGroup aria-label="Edit days">
        <Button
          className='border-right-0'
          variant="outline-secondary"
          onClick={() => changeDay(-1)}
        ><FaArrowLeft /></Button>
        <Button variant="outline-dark" disabled className='border-left-0 border-right-0'><FaRegCalendarAlt /></Button>
        <Button
          className='border-left-0'
          variant="outline-secondary"
          onClick={() => changeDay(1)}
          disabled={isToday}
        ><FaArrowRight /></Button>
      </ButtonGroup>
    </Grid>
    <Grid item>{day}</Grid>
  </Grid>
}


function FieldsAdvanced({fetchFieldEntries}) {
  const send = useStore(s => s.send)
  const jwt = useStore(s => s.jwt)
  const setServerError = useStore(s => s.apiError)
  const hasDupes = useStore(s => s.res.fields_entries_hasdupes_response)
  const [confirmWipe, setConfirmWipe] = useState('')

  async function downloadCsv(version) {
    // TODO refactor this into actions.js/fetch_
    const obj = {
      method: 'get',
      url: `${API_URL}/field-entries/csv/${version}`,
      headers: {'Authorization' : `Bearer ${jwt}`},
      responseType: 'blob',
    }

    try {
      const {data} = await axios(obj)
      const fname = {'new': 'field_entries', 'old': 'field_entries_old'}[version]
      fileDownload(data, `${fname}.csv`);
    } catch (error) {
      let {statusText: message, data} = error.response
      message = data.detail || message || "There was an error"
      setServerError(message)
    }
  }

  async function acceptDupes() {
    send('fields_entries_cleardupes_request', {})
  }

  async function startOver() {
    send('fields_entries_clear_request', {})
  }

  function changeConfirmWipe(e) {
    setConfirmWipe(e.target.value)
  }

  const btnOpts = {size: 'small', variant: 'primary', fullWidth: true}

  return <div>
    <Button
      {...btnOpts}
      onClick={() => downloadCsv('new')}
    >Download field_entries.csv</Button>
    <Typography variant='caption'>Export your field-entries to CSV</Typography>
    {hasDupes && <>
      <Alert2 severity='warning'>
        <Typography variant='caption'>Your field entries were effected by the <a href='https://github.com/lefnire/gnothi/issues/20' target='_blank'>duplicates bug</a>. See that link for details and what to do.</Typography>
        <hr />
        <Button
          {...btnOpts}
          onClick={() => downloadCsv('old')}
        >Download field_entries_old.csv</Button>
          <Typography variant='caption'>Export your original field-entries (before duplicates were fixed) to CSV</Typography>
        <Button
          {...btnOpts}
          variant='outlined'
          color='secondary'
          onClick={acceptDupes}
        >Accept Gnothi's fix</Button>
        <Typography variant='caption'>You can click through each day to find duplicates and select the correct entry, or click this to accept Gnothi's chose duplicate fixes for all days.</Typography>
      </Alert2>
    </>}
    <Button
      {...btnOpts}
      disabled={confirmWipe !== 'wipe field entries'}
      variant='outlined'
      color='secondary'
      onClick={startOver}
      sx={{mb: 2}}
    >Start Over</Button>
    <TextField
      size='small'
      placeholder="wipe field entries"
      value={confirmWipe}
      onChange={changeConfirmWipe}
      helperText={<>Wipe field entries for all days and start from scratch (keeping the fields, just clearing their entries). Enable the button by typing in the text-field "wipe field entries". <a href="https://github.com/lefnire/gnothi/issues/114" target="_blank">Why do this?</a></>}
    />
  </div>
}


export default function Fields() {
  const send = useStore(s => s.send)
  const user = useStore(s => s.user)
  const fields = useStore(state => state.res.fields_list_response?.rows)
  const fieldsGet = useStore(state => state.res.fields_list_response?.res)
  const fieldEntries = useStore(s => s.res.fields_entries_list_response?.hash)
  const fieldValues = useStore(s => s.fieldValues)
  const setFieldValues = useStore(a => a.setFieldValue)
  const syncRes = useStore(s => s.res.habitica_sync_response?.res)

  const [day, setDay] = useState(iso())
  const [showForm, setShowForm] = useState(false)
  const [showChart, setShowChart] = useState(false)
  // having lots of trouble refreshing certain things, esp. dupes list after picking. Force it for now
  const [cacheBust, setCacheBust] = useState(+new Date)

  const isToday = iso() === iso(day)

  const {as, viewer, me} = user

  useEffect(() => {
    fetchFieldEntries()
  }, [fields, day])

  // Update field-entries as they type / click, but not too fast; can cause race-condition in DB
  // https://www.freecodecamp.org/news/debounce-and-throttle-in-react-with-hooks/
  // TODO should I be using useRef instead of useCallback? (see link)
  const postFieldVal = useCallback(
    _.debounce(postFieldVal_, 100),
    [day] // re-initialize with day-change
  )

  console.log(fieldsGet)

  if (fieldsGet?.code === 403) {
    return <h5>{fieldsGet?.detail}</h5>
  }

  async function fetchFieldEntries() {
    if (_.isEmpty(fields)) {return}
    send('fields_entries_list_request', {day})
  }

  async function postFieldVal_(fid, value) {
    if (value === "") {return}
    value = parseFloat(value) // until we support strings
    const body = {id: fid, value}
    if (!isToday) {body['day'] = day}
    send(`fields_entries_post_request`, body)
  }

  const fetchService = async (service) => {
    send('habitica_sync_request', {})
  }

  const changeFieldVal = (fid, direct=false) => e => {
    let value = direct ? e : e.target.value
    setFieldValues({[fid]: value})
    postFieldVal(fid, value)
  }

  const changeCheck = fid => e => {
    changeFieldVal(fid, true)(~~!fieldValues[fid])
  }

  const renderSyncButton = (service) => {
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

  const onFormClose = () => {
    setShowForm(false)
  }

  const onChartClose = () => {
    setShowChart(false)
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

  const pickDupe = async (fid, val) => {
    await postFieldVal_(fid, val)
    await fetchFieldEntries()
    setCacheBust(+new Date)
  }

  function renderDupe(dupe) {
    const f = fields[dupe.field_id]
    const v = f.type === 'check' ? (dupe.value === 1 ? 'Yes' : 'No') : dupe.value
    return <div className='mb-3' key={dupe.id || 'guess'}>
      <Button variant='outline-dark' size='sm' onClick={() => pickDupe(f.id, dupe.value)}>
        Pick
      </Button>{' '}{v}{dupe.id ? '' : " (Gnothi's Guess)"}
    </div>
  }

  const renderDupes = (f, fe) => {
    return <Alert severity='warning'>
      <div><FaExclamationTriangle /> Duplicates <a href="https://github.com/lefnire/gnothi/issues/20" target="_blank">bug</a>! Pick the one that's correct.</div>
      {renderDupe(fe)}
      {fe.dupes.map(renderDupe)}
    </Alert>
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
    const n_dupes = _.get(fe, 'dupes.length', 0)
    return (
      <Grid
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
          {n_dupes > 1
            ? renderDupes(f, fe)
            : renderFieldEntry(f, fe)
          }
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
    fields: _(fields)
      .filter(v => !v.service && !v.excluded_at)
      .sortBy('id').value(),
    emptyText: () => <small className='text-muted'>
      <p>Fields are activity & quality trackers. Mood, sleep, substance, habits, etc. They can be numbers, checkboxes, or fivestar-ratings.<ul>
        <li>Track your mood, sleep patterns, substance intake, etc</li>
        <li>See stats (average, graphs, predictions)</li>
        <li>See how fields interact: correlation. Eg, "sleep most influenced by alcohol".</li>
        <li>Help long-term decisions by tracking options (fivestar-rate different jobs or moving destinations).</li>
        <li>Share fields, eg with a therapist who's interested in your mood or substances.</li>
        <li>For habits specifically, I recommend Habitica (below).</li>
      </ul></p>
    </small>
  }, {
    service: 'habitica',
    name: 'Habitica',
    fields: _(fields)
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
    fields: _(fields)
      .filter(v => v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <small className='text-muted'>
      <p>If you stop tracking a field, but keep it around just in case, click "Remove" and it will show up here.</p>
    </small>
  }, {
    service: 'advanced',
    name: 'Advanced',
    fields: [],
    emptyText: () => <FieldsAdvanced fetchFieldEntries={fetchFieldEntries} />
  }]

  const renderButtons = g => {
    if (g.service === 'custom') {
      return <Grid container justifyContent='space-around'>
        {!as && <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={() => setShowForm(true)}
        >New Field</Button>}
        {!!g.fields.length && <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => setShowChart(true)}
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
      {showForm && (
        <FieldModal
          close={onFormClose}
          field={showForm === true ? {} : fields[showForm]}
        />
      )}

      {showChart && (
        <ChartModal
          field={showChart === true ? null : fields[showChart]}
          overall={showChart === true}
          close={onChartClose}
        />
      )}

      {groups.map(renderGroup)}
    </div>

  }

  return <Card>
    <Grid container justifyContent='space-between'>
      <Grid item>
        <CardHeader title="Fields" />
      </Grid>
      <Grid item>
        <DayChanger day={day} isToday={isToday} setDay={setDay} />
      </Grid>
    </Grid>
    <CardContent>
      {renderFields()}
    </CardContent>
  </Card>
}
