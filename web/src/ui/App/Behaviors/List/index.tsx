import React, {useEffect, useState, useCallback} from "react";
// import {API_URL} from '../redux/ws'
import _ from "lodash";
import SetupHabitica from "../Modal/SetupHabitica";

import {useStore} from "@gnothi/web/src/data/store"

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CardContent from "@mui/material/CardContent";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button, {ButtonProps} from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import DayChanger from '../Modal/DayChanger'
import * as S from '@gnothi/schemas'
import {shallow} from 'zustand/shallow'
import Behavior from './Item'
import ManageBehaviorsIcon from '@mui/icons-material/SettingsOutlined';
import IconButton from "@mui/material/IconButton";
import Accordions from '../../../Components/Accordions.tsx'
import Stack from "@mui/material/Stack";
import CardActions from "@mui/material/CardActions";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import StarIcon from '@mui/icons-material/StarBorder';
import DoneIcon from '@mui/icons-material/Done';
import TipsIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import NumbersIcon from '@mui/icons-material/NumbersOutlined';
import {DISCORD_LINK} from "../../../../utils/config.ts";

// import ExpandMore from "@mui/icons-material/ExpandMore";
// import Advanced from "../Modal/Advanced";
// import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
// import {FaPlus as AddIcon} from "react-icons/fa";
// import BehaviorsIcon from "@mui/icons-material/InsertChartOutlinedRounded";
// import FitnessIcon from '@mui/icons-material/FitnessCenter';
// import AutoGraphIcon from '@mui/icons-material/AutoGraphOutlined';


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
    return <h5>{fields.res.data[0].error}</h5>
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
    fields: _.chain(fields?.rows)
      .filter(v => !v.service && !v.excluded_at)
      .sortBy('id').value(),
    emptyText: () => <Box>
      <Typography color="primary" textAlign="center" fontWeight={500} mb={1}>Welcome to the Behaviors
        feature!</Typography>
      <Typography textAlign="center" mb={1}>It’s here to help you track the activity or quality of the various behaviors
        in your life—like mood, sleep, substance, habits, etc. </Typography>
    </Box>

  }, {
    service: "about",
    name: "Getting Started",
    fields: [],
    emptyText: () => <Box>
      <Stack marginLeft={2}>
        <Typography mb={3} variant={"body1"}>Simply click <i>Add Behaviors</i> to fill out the form. Save, repeat for
          other behaviors, and start tracking.</Typography>
        <Typography color="#0077C2" variant={"body1"} fontWeight={500}><TipsIcon
          sx={{color: "#0077C2", fontSize: 18, marginRight: 1}}/>Pro Tip</Typography>
        <Typography variant="body2" mb={2}>Sync your Habitica account to Gnothi for advanced habit tracking and AI
          insights. See the <i>Habitica</i> drop-down for more info.</Typography>
        <Typography mb={1} color="primary" variant={"body1"} fontWeight={500}>Behavior Tracking Ideas</Typography>
        <Typography color="primary" variant={"body2"} fontWeight={500}><StarIcon
          sx={{color: "primary", fontSize: 15, marginRight: 1}}/>Five-Star Rating for Quality</Typography>
        <Typography variant="body2" mb={2}> Intended for measuring the quality of your experiences in a day, such as
          sleep, mood, energy, and productivity.</Typography>
        <Typography color="primary" variant={"body2"} fontWeight={500}><DoneIcon
          sx={{color: "primary", fontSize: 15, marginRight: 1}}/>Check for "Yes/No" Behaviors</Typography>
        <Typography variant="body2" mb={2}>Ideal for tracking daily tasks. <i>Did I meditate, take medication, exercise,
          journal, read, etc?</i></Typography>
        <Typography color="primary" variant={"body2"} fontWeight={500}><NumbersIcon
          sx={{color: "primary", fontSize: 15, marginRight: 1}}/>Numbers for Quantity</Typography>
        <Typography variant="body2" mb={2}>Some ideas include hours slept, number of walks, alcohol/substance intake,
          chapters read, and number of glasses of water.</Typography>

      </Stack>
    </Box>
  }, {
    service: 'habitica',
    name: 'Habitica',
    fields: _.chain(fields?.rows)
      .filter(v => v.service === 'habitica' && !v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <Box>
      <Typography mb={3}>Combine the robust functionality of Habitica with Gnothi's AI-driven tools to gain deeper
        self-understanding.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>What is Habitica?</Typography>
      <Typography variant="body2" mb={2}>Created by one of the creators of Gnothi, Habitica is a gamified habit tracking
        platform that empowers users to track behaviors, to-dos, and habits with its comprehensive
        functionality.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>Why create a Habitica account to sync to
        Gnothi?</Typography>
      <Typography variant="body2" mb={2}>While Gnothi allows you to add and track custom behaviors directly, power-users
        will appreciate the rich features offered by Habitica for habit-tracking and daily to-dos
        specifically.</Typography>
      <Typography variant="body2" mb={2}>To get the best of both worlds, use Gnothi for qualitative data (mood,
        sleep-quality, decisions) and Habitica for habits and to-dos. Then supercharge your experience with AI insights
        from Gnothi.</Typography>
      <Typography mb={1} color="primary" variant={"body1"} fontWeight={500}>Syncing Habitica to Gnothi:</Typography>
      <Typography mb={1} variant={"body2"}>1. Sign up for <a href='https://habitica.com/' target='_blank'>Habitica</a>
        <i>(free)</i></Typography>
      <Typography mb={1} variant={"body2"}>2. Go to settings in your Habitica account</Typography>
      <Typography mb={1} variant={"body2"}>3. Select the "API" tab</Typography>
      <Typography mb={1} mb={3} variant={"body2"}>4. Enter your User ID and API token <i>(below)</i></Typography>
      <Typography color="#0077C2" variant={"body1"} fontWeight={500}>Have questions?</Typography>
      <Typography mb={3} color="#0077C2" fontWeight={500} variant={"body2"}>Feel free to send an <a
        href="mailto:gnothi@gnothiai.com">email</a> or reach out on <a href={DISCORD_LINK}
                                                                       target="_blank">Discord</a> to
        connect.</Typography>
      <Typography mb={3}>Your User ID and API Token are database-encrypted. <em>All</em> sensitive data in Gnothi is
        encrypted.</Typography>
    </Box>

  }, {
    service: 'excluded',
    name: 'Excluded from AI',
    fields: _.chain(fields?.rows)
      .filter(v => !!v.excluded_at)
      .sortBy('id')
      .value(),
    emptyText: () => <Box>
      <Typography mb={3}>Customize your AI insights on Gnothi by excluding specific behaviors.</Typography>
      <Typography color="primary" variant={"body1"} fontWeight={500}>What does it mean to <i>exclude</i> a
        behavior?</Typography>
      <Typography variant="body2" mb={2}>If you stop tracking a behavior but want to keep it for reference, you can
        click "Exclude" to prevent it from appearing in your active tracking.</Typography>
      <Typography variant="body2" mb={2}>For instance, if you have synced your Habitica account and imported a daily
        "to-do," excluding it on Gnothi ensures that you won't receive AI insights and charts specifically related to
        your progress with that behavior.</Typography>
      <Typography mb={1} color="primary" variant={"body1"} fontWeight={500}>How to exclude a behavior:</Typography>
      <Typography mb={1} variant={"body2"}>1. Click on the behavior you want to exclude</Typography>
      <Typography mb={1} variant={"body2"}>2. Select the <i>Advanced</i> drop-down in the <i>Edit
        Behavior</i> form</Typography>
      <Typography mb={1} variant={"body2"}>3. Click on the <i>Exclude</i> button</Typography>
      <Typography mb={3} variant={"body2"}>Note: If you decide to track the behavior again, it will be here in the
        "Excluded" drop-down.</Typography>
      <Typography color="#0077C2" variant={"body1"} fontWeight={500}>Have questions?</Typography>
      <Typography mb={3} color="#0077C2" fontWeight={500} variant={"body2"}>Feel free to send an <a
        href="mailto:gnothi@gnothiai.com">email</a> or reach out on <a href={DISCORD_LINK}
                                                                       target="_blank">Discord</a> to
        connect.</Typography>
    </Box>
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

  // This renders the main section, if we're inside the Modal (advanced view)
  if (advanced) {
    return <div className="list">
      <Card
        sx={{backgroundColor: '#ffffff', borderRadius: 2, height: "100%"}}
      >
        <CardContent sx={{mx: 1}}>
          <Typography variant="h4" color="primary" fontWeight={500} mt={1} mb={2}>Track Behaviors</Typography>
          <Box mb={1}>
            <DayChanger/>
          </Box>
          <AccordionDetails>
            {renderGroup(groups[0])}
          </AccordionDetails>
          <CardActions sx={{justifyContent: 'flex-end', mb: 2}}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => setView({view: "new"})}
            >
              Add Behavior
            </Button>
            {/*<Button variant="contained" color="secondary" onClick={() => setView({view: "overall"})}>Top Influencers</Button>*/}
          </CardActions>
          <Stack spacing={1}>
            {groups.slice(1).map(renderGroupAccordion)}
          </Stack>
        </CardContent>
      </Card>
    </div>
  }

  // This is what's seen if we're NOT in the Modal. For now, just what shows on Entry.View sidebar
  return <Card
    sx={{backgroundColor: '#ffffff', borderRadius: 2, paddingLeft: 1.5, height: "100%"}}
  >
    <CardContent>
      <Grid
        container
        sx={{mb: 2}}
        alignItems="flex-end"
        justifyContent="flex-end"
      >
        <Grid item>
            <IconButton
              color='primary'
              size="small"
              onClick={() => setView({page: "modal", view: "overall"})}
            >
              <ManageBehaviorsIcon sx={{fontSize: 25}}/>
            </IconButton>
          </Grid>

        <Grid item container xs={12} justifyItems="center" alignItems="space-between">
          <Grid item xs>
            <Typography
              sx={{m: 0, p: 0}}
              variant='h4'
              fontWeight={500}
              color='primary'
            >
              Behaviors
            </Typography>
            <Typography color="primary" mb={2} variant={"body1"} fontWeight={500}>
              Track behaviors to get AI insights</Typography>
          </Grid>

        </Grid>
      </Grid>

      {renderGroup(groups[0])}


      <CardActions sx={{justifyContent: "flex-end", mt: 3}}>
        <Button
          onClick={toggleShowAbout}
          variant="outlined"
          color="secondary"
          size={"small"}
        >
          {showAbout ? "Hide" : "About Behaviors"}
        </Button>
      </CardActions>
      {showAbout && <Box>
        <Box mb={2}>
          <Typography mb={0} color="primary" variant="h4" mt={3} fontWeight={500}>Using Behaviors</Typography>
          <Typography mb={2} color="primary" variant={"body1"} fontWeight={600}>Set the stage for personalized AI
            insights</Typography>
          <Typography mb={1} variant="body1">Whether it's exercise, mood, sleep, or anything in between, log it here.
            The AI will then review your data to identify patterns, correlations, and even predicts future entries.
          </Typography>
          <Typography mb={.5} fontWeight={500} color="secondary" variant="body2">Click on the “<SettingsIcon
            sx={{fontSize: 15, color: "secondary"}}/>” icon above to add behaviors and manage settings.</Typography>
        </Box>
        <Box mb={2}>
          <Typography mb={0} color="primary" variant="h4" mt={3} fontWeight={500}>About the Tech</Typography>
          <Typography mb={2} color="primary" variant={"body1"} fontWeight={600}>An exciting update is around the
            corner</Typography>
          <Typography mb={1} variant="body1">While we’ve temporarily removed its machine learning capabilities, we're
            developing an upgrade that will offer the latest in AI technology.
          </Typography>
          <Typography mb={.5} variant="body1">For now, keep tracking your behaviors. Your data will seamlessly integrate
            into the new system once it's launched.</Typography>
        </Box>
      </Box>}

    </CardContent>


  </Card>


}
// To use for later to provide ideas for behaviors and optimal settings
{/*<Box mb={2}>*/
}
{/*  <Typography color="primary" variant={"body1"} fontWeight={600}>Songs:</Typography>*/
}
{/*  <Typography mb={.5} variant="body1">Use this tag for songs or poems that resonate with you.</Typography>*/
}
{/*  <Typography variant="body2"><u>Index</u>: Enabled, to help AI to understand you better.</Typography>*/
}
{/*  <Typography variant="body2"><u>Summarize</u>: Disabled, to preserve the original essence of the*/
}
{/*    content.</Typography>*/
}
{/*</Box>*/
}


