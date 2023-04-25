import React, {useEffect, useState, useCallback} from "react";
// import {API_URL} from '../redux/ws'
import _ from "lodash";
import SetupHabitica from "../Modal/SetupHabitica";

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
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Advanced from "../Modal/Advanced";
import DayChanger from '../Modal/DayChanger'
import * as S from '@gnothi/schemas'
import shallow from 'zustand/shallow'
import Behavior from './Item'

interface FieldGroup {
  service: string
  name: string
  fields: S.Fields.fields_list_response[]
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

  // [day] dependency handled in store setter
  useEffect(() => {
    fetchFieldEntries()
  }, [fields])

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
        {!!g.fields.length && advanced && <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={showOverall}
        >Top Influencers</Button>}
        {!advanced && <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => setView({page: "modal", view: "new"})}
        >
          Manage
        </Button>}
      </Grid>
    }
    if (g.service === 'habitica' && !as) {
      return <SetupHabitica />
    }
    return null
  }

  function renderBehavior(f: S.Fields.fields_list_response) {
    return <Behavior key={f.id} fid={f.id} advanced={advanced} />
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
        {!g.fields.length ? g.emptyText() : g.fields.map(renderBehavior)}
        {renderSyncButton(g.service)}
        {renderButtons(g)}
      </AccordionDetails>
    </Accordion>
  )

  return <div className="list">
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
