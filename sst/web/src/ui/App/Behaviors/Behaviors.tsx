import React, {useEffect, useState, useCallback} from "react";
// import {API_URL} from '../redux/ws'
import _ from "lodash";
import ReactStars from "react-stars";
import SetupHabitica from "./Modal/SetupHabitica";
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
import Advanced from "./Modal/Advanced";
import DayChanger from './DayChanger'
import * as S from '@gnothi/schemas'
import shallow from 'zustand/shallow'
import {Behavior} from './Behavior'

type FE = S.Fields.fields_entries_list_response
type F = S.Fields.fields_list_response

interface FieldGroup {
  service: string
  name: string
  fields: F[]
  emptyText: () => JSX.Element
}

interface Behaviors {
  advanced: boolean
}

// TODO memoize this component, with some setter just for advanced=true|false. False just
// hides certain elements
export default function Behaviors({advanced}: Behaviors) {
  const [
    send,
    user,
    fields,
    syncRes,

    day,
    isToday,
    setView
  ] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response,
    s.res.habitica_sync_response?.res,

    s.behaviors.day,
    s.behaviors.isToday,
    s.behaviors.setView
  ], shallow)


  // TODO cache-busting @ 49d212a2
  // ensure no longer needed. Original comment:
  // having lots of trouble refreshing certain things, esp. dupes list after picking. Force it for now

  const {as, viewer, me} = user

  const showNew = useCallback(() => setView({view: "new"}), [])
  const showOverall = useCallback(() => setView({view: "overall"}), [])

  useEffect(() => {
    fetchFieldEntries()
  }, [fields, day])

  if (fields?.res?.error && fields.res.code === 403) {
    return <h5>{fields.res.data}</h5>
  }

  async function fetchFieldEntries() {
    if (_.isEmpty(fields)) {return}
    send('fields_entries_list_request', {day})
  }

  const fetchService = async (service: string) => {
    send('habitica_sync_request', {})
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

  // see 3b92a768 for dynamic field groups. Revisit when more than one service,
  // currently just habitica
  const groups: FieldGroup[] = [{
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

  const renderButtons = (g: FieldGroup) => {
    if (g.service === 'custom') {
      return <Grid container justifyContent='space-around'>
        {!as && <Button
          className="btn-new"
          color="primary"
          variant="contained"
          size="small"
          onClick={showNew}
          // FIXME recursive render <Behaviors /> ?
        >New Field</Button>}
        {!!g.fields.length && <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={showOverall}
        >Top Influencers</Button>}
      </Grid>
    }
    if (g.service === 'habitica' && !as) {
      return <SetupHabitica />
    }
    return null
  }

  const renderGroup = (g: FieldGroup) => (
    <Accordion key={g.service} defaultExpanded={g.service === "custom"}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography>{g.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {!g.fields.length ? g.emptyText() : g.fields.map(f => <Behavior key={f.id} fid={f.id} />)}
        {renderSyncButton(g.service)}
        {renderButtons(g)}
      </AccordionDetails>
    </Accordion>
  )

  return <div className="fields">
    <Card>
      <Grid container justifyContent='space-between'>
        <Grid item>
          {advanced ? <>
            <DayChanger />
          </> : <>
            <CardHeader title="Behaviors" />
          </>}
        </Grid>
      </Grid>
      <CardContent>
        {groups.map(renderGroup)}
      </CardContent>
    </Card>
  </div>
}
