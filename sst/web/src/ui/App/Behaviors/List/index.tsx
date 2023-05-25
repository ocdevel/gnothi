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
import {shallow} from 'zustand/shallow'
import Behavior from './Item'
import ManageBehaviorsIcon from '@mui/icons-material/SettingsOutlined';
import IconButton from "@mui/material/IconButton";
import Accordions from '../../../Components/Accordions.tsx'
import Stack from "@mui/material/Stack";


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
    dayStr,
    isToday,
    setView
  ] = useStore(s => [
    s.send,
    s.user,
    s.res.fields_list_response,
    s.res.habitica_sync_response?.res,

    s.behaviors.day,
    s.behaviors.dayStr,
    s.behaviors.isToday,
    s.behaviors.setView
  ], shallow)


  // TODO cache-busting @ 49d212a2
  // ensure no longer needed. Original comment:
  // having lots of trouble refreshing certain things, esp. dupes list after picking. Force it for now

  const {as, viewer, me} = user

  const showNew = useCallback(() => setView({view: "new"}), [])
  const showOverall = useCallback(() => setView({view: "overall"}), [])

  const [showAbout, setShowAbout] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const toggleShowAbout = useCallback(() => setShowAbout(!showAbout), [showAbout])

  // [day] dependency handled in store setter
  useEffect(() => {
    fetchFieldEntries()
  }, [fields])

  if (fields?.res?.error && fields.res.code === 403) {
    return <h5>{fields.res.data}</h5>
  }

  async function fetchFieldEntries() {
    if (_.isEmpty(fields)) {
      return
    }
    send('fields_entries_list_request', {day: dayStr})
  }

  const fetchService = async (service: string) => {
    setSyncing(true)
    send('habitica_sync_request', {})
  }

  useEffect(() => {
    setSyncing(false)
  }, [syncRes])

  const renderSyncButton = (service: string) => {
    if (!~['habitica'].indexOf(service)) {
      return null
    }
    if (as) {
      return null
    }
    if (!me?.habitica_user_id) {
      return null
    }
    if (syncing) {
      return <CircularProgress/>
    }
    return <>
      <Tooltip title='Gnothi auto-syncs every hour'>
        <Button sx={{mb: 2}} size='small' variant='contained' onClick={() => fetchService(service)}>Sync</Button>
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
      <Box>Fields are activity & quality trackers. Mood, sleep, substance, habits, etc. They can be numbers, checkboxes,
        or fivestar-ratings.
        <ul>
          <li>Track your mood, sleep patterns, substance intake, etc</li>
          <li>See stats (average, graphs, predictions)</li>
          <li>See how fields interact: correlation. Eg, "sleep most influenced by alcohol".</li>
          <li>Help long-term decisions by tracking options (fivestar-rate different jobs or moving destinations).</li>
          <li>Share fields, eg with a therapist who's interested in your mood or substances.</li>
          <li>For habits specifically, I recommend Habitica (below).</li>
        </ul>
      </Box>
    </small>
  }, {
    service: "about",
    name: "About",
    fields: [],
    emptyText: () => <Box>
      About behaviors
    </Box>
  }, {
    service: 'habitica',
    name: 'Habitica',
    fields: _(fields?.rows)
      .filter(v => v.service === 'habitica' && !v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <small className='text-muted'>
      <p>For habit-tracking (exercise, substance, productivity, etc) I recommend <a href='FIXME'
                                                                                    target='_blank'>Habitica</a>. Gnothi
        will sync Habitica habits & dailies.</p>
      <p>Use Gnothi fields for qualitative data (mood, sleep-quality, decisions) and Habitica for habits. Habitica
        doesn't support arbitrary number entries.</p>
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
  },
    // {
    //   service: 'advanced',
    //   name: 'Advanced',
    //   fields: [],
    //   emptyText: () => <Advanced fetchFieldEntries={fetchFieldEntries} />
    // }
  ]

  const renderButtons = (g: FieldGroup) => {
    if (g.service === 'custom') {
      return null
      if (!(g.fields.length && advanced)) {
        return null
      }
      return <Grid container justifyContent='space-around'>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={showOverall}
        >Top Influencers</Button>
      </Grid>
    }
    if (g.service === 'habitica' && !as) {
      return <SetupHabitica/>
    }
    return null
  }

  function renderBehavior(f: S.Fields.fields_list_response) {
    return <Behavior key={f.id} fid={f.id} advanced={advanced}/>
  }

  function renderGroup(g: FieldGroup) {
    return <>
      {!g.fields.length ? g.emptyText() : g.fields.map(renderBehavior)}
      {renderSyncButton(g.service)}
      {renderButtons(g)}
    </>
  }

  function renderGroupAccordion(g: FieldGroup) {
    // return <Accordion sx={{backgroundColor: '#ffffff', borderRadius: 2}} key={g.service} defaultExpanded={g.service === "custom"}>
    const defaultExpanded = (g.service === "custom") ? 0 : -1
    return <Accordions
      key={g.service}
      defaultExpanded={defaultExpanded}
      accordions={[{
        title: g.name,
        content: renderGroup(g)
      }]}
    />
  }

  if (advanced) {
    return <div className="list">
      <Card
        sx={{backgroundColor: '#ffffff', borderRadius: 2}}
      >
        <CardContent>
          <DayChanger/>
          <AccordionDetails>
            {renderGroup(groups[0])}
          </AccordionDetails>
          <Stack spacing={1}>
            {groups.slice(1).map(renderGroupAccordion)}
          </Stack>
        </CardContent>
      </Card>
    </div>
  }
  return <Card
    sx={{backgroundColor: '#ffffff', borderRadius: 2}}
  >
    <CardContent>
      <Grid
        container
        sx={{mb: 2}}
        justifyContent="space-between"
        alignItems='center'

      >
        <Grid item>
          <Typography
            sx={{m: 0, p: 0}}
            variant='h4'
            fontWeight={500}
            color='primary'
          >
            Behaviors
          </Typography>
        </Grid>
        <Grid item>
          <IconButton
            color='primary'
            onClick={() => setView({page: "modal", view: "new"})}
          >
            <ManageBehaviorsIcon/>
          </IconButton>
        </Grid>
      </Grid>
      {renderGroup(groups[0])}

      <Button
        sx={{my: 2}}
        onClick={toggleShowAbout}
        variant="outlined"
      >
        {showAbout ? "Hide" : "About Behaviors"}
      </Button>
      {showAbout && <Box>
        <Box mb={2}>
          <Typography color="primary" variant="h4" mt={3} fontWeight={500}>Tag Setting Suggestions</Typography>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Main:</Typography>
          <Typography mb={.5} variant="body1">This is our standard tag. The majority of entries fall under this
            category.</Typography>
          <Typography variant="body2"><u>Index</u>: Enabled, to help AI to understand you better.</Typography>
          <Typography variant="body2"><u>Summarize</u>: Enabled, to capture snapshots of your entries in
            aggregate.</Typography>
        </Box>
        <Box mb={2}>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Dreams:</Typography>
          <Typography mb={.5} variant="body1">Ideal for logging dreams. Plus, we'll be launching a Dream Analysis
            feature very shortly!</Typography>
          <Typography variant="body2"><u>Index</u>: Disabled, to prevent dream-based suggestions.</Typography>
          <Typography variant="body2"><u>Summarize</u>: Enabled, for quick dream recollection.</Typography>
        </Box>
        <Box mb={2}>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Songs:</Typography>
          <Typography mb={.5} variant="body1">Use this tag for songs or poems that resonate with you.</Typography>
          <Typography variant="body2"><u>Index</u>: Enabled, to help AI to understand you better.</Typography>
          <Typography variant="body2"><u>Summarize</u>: Disabled, to preserve the original essence of the
            content.</Typography>
        </Box>
        <Box mb={2}>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Therapy:</Typography>
          <Typography mb={.5} variant="body1">Use may decide to create this tag to to share specific entries with your
            therapist.</Typography>
          <Typography variant="body2"><u>Index</u>: Enabled, get AI insights like recurring themes, books,
            etc.</Typography>
          <Typography variant="body2"><u>Summarize</u>: Enabled, to summarize your progress and
            experiences.</Typography>
        </Box>
        <Box mb={2}>
          <Typography color="primary" variant="h4" mt={3} fontWeight={500}>Pro Tips:</Typography>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Multi-Tagging:</Typography>
          <Typography variant="body1">Assign multiple tags to an entry, when it makes sense, to capture it in different
            contexts.</Typography>
        </Box>
        <Box mb={2}>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Consistency:</Typography>
          <Typography variant="body1">Stick to the same tags for similar entries to simplify searching and stay
            organized.</Typography>
        </Box>
        <Typography color="primary" variant={"body1"} fontWeight={600}>Balanced Tagging:</Typography>
        <Typography variant="body1">Opt for tags that are precise, yet inclusive enough to group related
          entries.</Typography>
      </Box>}

    </CardContent>


  </Card>


}


