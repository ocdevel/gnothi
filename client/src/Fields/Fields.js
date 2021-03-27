import React, {useEffect, useState, useCallback} from "react";
import {SimplePopover, spinner} from "../utils";
import {API_URL} from '../redux/ws'
import _ from "lodash";
import {
  Accordion,
  Button,
  Card,
  Form,
  Row,
  Col,
  ButtonGroup,
  Alert, Modal
} from "react-bootstrap";
import ReactStars from "react-stars";
import SetupHabitica from "./SetupHabitica";
import FieldModal from "./FieldModal";
import ChartModal from "./ChartModal";
import {FieldName} from "./utils";
import moment from 'moment'

import {useStoreState, useStoreActions} from "easy-peasy";
import './Fields.scss'
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendar,
  FaChartLine,
  FaExclamationTriangle,
  FaRegCalendarAlt
} from "react-icons/all";
import axios from "axios";
import fileDownload from 'js-file-download';

const fmt = 'YYYY-MM-DD'
const iso = (day=null) => {
  const m = day ? moment(day) : moment()
  return m.format(fmt)
}


function FieldsAdvanced({fetchFieldEntries}) {
  const emit = useStoreActions(a => a.ws.emit)
  const jwt = useStoreState(state => state.user.jwt)
  const setServerError = useStoreActions(actions => actions.server.error)
  const hasDupes = useStoreState(s => s.ws.data['fields/field_entries/has_dupes/get'])
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
    emit(['fields/field_entries/clear_dupes/post', {}])
  }

  async function startOver() {
    emit(['fields/field_entries/clear_entries/post', {}])
  }

  function changeConfirmWipe(e) {
    setConfirmWipe(e.target.value)
  }

  const btnOpts = {size: 'sm', variant: 'outline-primary', className: 'fields-adv-btn mt-3'}

  return <div>
    <Button
      {...btnOpts}
      onClick={() => downloadCsv('new')}
    >Download field_entries.csv</Button>
    <Form.Text>Export your field-entries to CSV</Form.Text>
    <hr/>
    {hasDupes && <>
      <Alert variant='warning'>
        <Form.Text>Your field entries were effected by the <a href='https://github.com/lefnire/gnothi/issues/20' target='_blank'>duplicates bug</a>. See that link for details and what to do.</Form.Text>

      <Button
        {...btnOpts}
        onClick={() => downloadCsv('old')}
      >Download field_entries_old.csv</Button>
      <Form.Text>Export your original field-entries (before duplicates were fixed) to CSV</Form.Text>
      <Button
        {...btnOpts}
        variant='outline-danger'
        onClick={acceptDupes}
      >Accept Gnothi's fix</Button>
      <Form.Text>You can click through each day to find duplicates and select the correct entry, or click this to accept Gnothi's chose duplicate fixes for all days.</Form.Text>
      </Alert>
    </>}
    <Button
      {...btnOpts}
      disabled={confirmWipe !== 'wipe field entries'}
      variant='outline-danger'
      onClick={startOver}
    >Start Over</Button>
    <Form.Control
      type="text"
      size='sm'
      placeholder="wipe field entries"
      value={confirmWipe}
      onChange={changeConfirmWipe}
    />
    <Form.Text>Wipe field entries for all days and start from scratch (keeping the fields, just clearing their entries). Enable the button by typing in the text-field "wipe field entries". <a href="https://github.com/lefnire/gnothi/issues/114" target="_blank">Why do this?</a></Form.Text>
  </div>
}


export default function Fields() {
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(state => state.ws.as)
  const user = useStoreState(s => s.ws.data['users/user/get'])
  const fields = useStoreState(state => state.ws.data['fields/fields/get'])
  const fieldsGet = useStoreState(state => state.ws.res['fields/fields/get'])
  const fieldEntries = useStoreState(s => s.ws.data['fields/field_entries/get'])
  const fieldValues = useStoreState(s => s.ws.data.fieldValues)
  const setFieldValues = useStoreActions(a => a.ws.setFieldValue)
  const syncRes = useStoreState(s => s.ws.res['habitica/sync'])

  const [day, setDay] = useState(iso())
  const [showForm, setShowForm] = useState(false)
  const [showChart, setShowChart] = useState(false)
  // having lots of trouble refreshing certain things, esp. dupes list after picking. Force it for now
  const [cacheBust, setCacheBust] = useState(+new Date)

  const isToday = iso() === iso(day)

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
    emit(['fields/field_entries/get', {day}])
  }

  async function postFieldVal_(fid, value) {
    if (value === "") {return}
    value = parseFloat(value) // until we support strings
    const body = {id: fid, value}
    if (!isToday) {body['day'] = day}
    emit([`fields/field_entries/post`, body])
  }

  const fetchService = async (service) => {
    emit(['habitica/sync'])
  }

  const changeFieldVal = (fid, direct=false) => e => {
    let value = direct ? e : e.target.value
    setFieldValues({[fid]: value})
    postFieldVal(fid, value)
  }

  const changeCheck = fid => e => {
    changeFieldVal(fid, true)(~~!fieldValues[fid])
  }

  const changeDay = dir => {
    if (dir === -1 ) {
      setDay(moment(day).subtract(1, 'day').format(fmt))
    } else {
      setDay(moment(day).add(1, 'day').format(fmt))
    }
  }

  const renderSyncButton = (service) => {
    if (!~['habitica'].indexOf(service)) {return null}
    if (as) {return null}
    if (!user.habitica_user_id) {return null}
    if (syncRes?.sending) {return spinner}
    return <>
      <SimplePopover text='Gnothi auto-syncs every hour'>
        <Button size='sm' onClick={() => fetchService(service)}>Sync</Button>
      </SimplePopover>
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
      <Form.Check
        type='radio'
        label='Yes'
        id={f.id + '-yes'}
        inline
        checked={v > 0}
        onChange={changeCheck(f.id)}
      />
      <Form.Check
        type='radio'
        label='No'
        id={f.id + '-no'}
        inline
        checked={v < 1}
        onChange={changeCheck(f.id)}
      />
    </div>
    return <>
      <Form.Control
        disabled={!!f.service && isToday}
        type='number'
        size="sm"
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
    return <Alert variant='warning' style={{margin: 0, padding: 0}}>
      <div><FaExclamationTriangle /> Duplicates <a href="https://github.com/lefnire/gnothi/issues/20" target="_blank">bug</a>! Pick the one that's correct.</div>
      {renderDupe(fe)}
      {fe.dupes.map(renderDupe)}
    </Alert>
  }



  const renderField = (f) => {
    let rowStyle = {width: '100%', margin: 0}
    if (f.excluded_at) {
      rowStyle = {
        ...rowStyle,
        textDecoration: 'line-through',
        opacity: .5
      }
    }
    const c1 = {xs: 5}
    const c2 = {xs: 5}
    const c3 = {xs: 2}
    const colStyle = {style: {padding: 3}}
    const fe = fieldEntries[f.id]
    const n_dupes = _.get(fe, 'dupes.length', 0)
    return (
      <Row
        key={`${f.id}-${cacheBust}`}
        style={rowStyle}
      >
        <Col
          {...c1}
          {...colStyle}
          onClick={() => setShowForm(f.id)}
          className='cursor-pointer'
        >
          <FieldName name={f.name}/>
        </Col>
        <Col {...c2} {...colStyle}>
          {n_dupes > 1
            ? renderDupes(f, fe)
            : renderFieldEntry(f, fe)
          }
        </Col>
        <Col {...c3} {...colStyle}>
          <div
            onClick={() => setShowChart(f.id)}
            className='cursor-pointer'
          >
            <FaChartLine />{' '}
            {f.avg && f.avg.toFixed(1)}
          </div>
        </Col>
      </Row>
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
      <p>For habit-tracking (exercise, substance, productivity, etc) I recommend <a href='https://habitica.com/' target='_blank'>Habitica</a>. Gnothi will sync Habitica habits & dailies.</p>
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
      return <>
        {!as && <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(true)}
          className='mb-3'
        >New Field</Button>}
        {!!g.fields.length && <Button
          variant="outline-primary"
          style={{float:'right'}}
          size="sm"
          onClick={() => setShowChart(true)}
        >Top Influencers</Button>}
      </>
    }
    if (g.service === 'habitica' && !as) {
      return <SetupHabitica />
    }
    return null
  }

  const renderGroup = g => (
    <Card key={g.service}>
      <Accordion.Toggle as={Card.Header} eventKey={g.service}>
        {g.name}
      </Accordion.Toggle>
      <Accordion.Collapse eventKey={g.service}>
        <Card.Body>
          {g.fields.length ? g.fields.map(renderField) : g.emptyText()}
          {renderSyncButton(g.service)}
          {renderButtons(g)}
        </Card.Body>
      </Accordion.Collapse>
    </Card>
  )

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

    <Accordion defaultActiveKey="custom">
      {groups.map(renderGroup)}
    </Accordion>

    <div className='day-changer'>
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
    </div>
    <div className='selected-day'>{day}</div>
  </div>
}
