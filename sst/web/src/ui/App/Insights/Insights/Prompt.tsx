// @ts-ignore

import React, {useState, useEffect, useCallback} from 'react'

import {useStore} from "@gnothi/web/src/data/store"
import axios from "axios"
import Typography from "@mui/material/Typography";
import {LinearProgress} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import keyBy from 'lodash/keyBy'
import * as S from '@gnothi/schemas'
import Divider from "@mui/material/Divider";
import {Insight} from './Utils'
import Grow from '@mui/material/Grow';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import {BasicTabs} from "../../../Static/Splash/Features/FeatureLayout";

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


// type Preset = keyof typeof promptsObj
type Preset = {
  key: string
  label: string
  prompt: string
}

type Prompt = Insight & {
  entry_ids: string[]
}
type Trips = {
  waiting: boolean
  responses: S.Insights.insights_prompt_response[]
  prompts: string[]
}

export default function Prompt({
                                 entry_ids,
                                 view,
                               }: Prompt) {
  const insightsModal = useStore(s => s.insightsModal)
  const teaser = insightsModal === null
  const setInsightsModal = useStore(s => s.setInsightsModal)
  // TODO useStore version of loading
  const [trips, setTrips] = useState<Trips>({
    prompts: [],
    responses: [],
    waiting: false,
  })
  const send = useStore(useCallback(s => s.send, []))
  const promptResponse = useStore(s => s.res.insights_prompt_response?.hash?.[view])
  // start with just blank prompt, will populate other prompts via HTTP -> Gist
  const [prompts, setPrompts] = useState<Preset[]>([{
    "key": "blank",
    "label": "Blank",
    "prompt": ""
  }])
  const [preset, setPreset] = useState<string>("")
  const [prompt, setPrompt] = useState<string>("")
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const promptsObj = keyBy(prompts, 'key')

  async function getPrompts() {
    const promptsUrl = "https://gist.githubusercontent.com/lefnire/57023741c902627064e7d24302aa402f/raw/prompts.json"
    const {data} = await axios.get(promptsUrl)
    setPrompts(data as Preset[])
  }

  useEffect(() => {
    getPrompts()
  }, [])

  useEffect(() => {
    if (!promptResponse) {
      return
    }
    setTrips({
      ...trips,
      waiting: false,
      responses: [...trips.responses, promptResponse]
    })
  }, [promptResponse])

  const changePreset: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const preset = e.target.value
    setPreset(preset)
    setPrompt(promptsObj[preset].prompt)
  }

  function submit() {
    setTrips({
      ...trips,
      waiting: true,
      prompts: [...trips.prompts, prompt]
    })
    console.log("prompt", entry_ids)
    send("insights_prompt_request", {
      view,
      entry_ids,
      prompt
    })
  }

  function renderResponse(
    _: any,
    i: number
  ) {
    const prompt = trips.prompts[i]
    const res = trips.responses[i]
    return <Grow
      in={true}
      key={res.id}
      style={{transformOrigin: '0 0 0'}}
      timeout={1000}
    >
      <Box>
        <Typography>Q: {prompt}</Typography>
        <Typography>A: {res.response}</Typography>
        <Divider/>
      </Box>
    </Grow>
  }

  const borderRadius = 3


  function renderTeaser() {
    return <Stack
      spacing={2}
      component="form"
      alignItems='flex-end'>

      <FormControl fullWidth>
        <InputLabel
          id="demo-simple-select-label">Presets</InputLabel>
        <Select
          sx={{borderRadius}}
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={preset}
          label="Presets"
          onChange={changePreset as any}
        >
          {prompts.map(({key, label}) => (
            <MenuItem
              key={key} value={key}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth={true}
        sx={{
          '& fieldset': {
            borderRadius,
          },
        }}
        id="outlined-multiline-flexible"
        label="Prompt"
        multiline
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        maxRows={4}
        // helperText="Enter a prompt, with <placeholder> values like so: Interpret the following dream <paragraphs>"
      />

      {/*<Button onClick={() => setShowHelp(!showHelp)}>{showHelp ? "Hide help" : "Show Help"}</Button>*/}
      {/*{showHelp && <Typography>*/}
      {/*  Legend. The following placeholders are supported in your prompt:*/}
      {/*  <ul>*/}
      {/*    <li>&lt;entry&gt; - Uses your entire entry as the context for the prompt. Use with caution, as there's a max*/}
      {/*      number of characters that OpenAI can take as input. If you exceed, your entry will be truncated. If you know*/}
      {/*      your entry is short enough, use this. Otherwise, use &lt;paragraphs&gt; or &lt;summary&gt;</li>*/}
      {/*    <li>&lt;paragraphs&gt; - Runs the prompt independently for each paragraph in your entry</li>*/}
      {/*    <li>&lt;summary&gt; - Runs the prompt over the summary of your entry. Ideal for longer entries, where the*/}
      {/*      context should capture the essence of your entry (rather than the specifics).*/}
      {/*    </li>*/}
      {/*  </ul>*/}
      {/*</Typography>}*/}

      <Box>
        <Button
          sx={{elevation: 12}}
          variant="contained"
          color="secondary"
          disabled={trips.waiting}
          onClick={submit}
        >
          {trips.waiting ? <CircularProgress/> : "Submit"}
        </Button>
      </Box>
      {trips.responses.map(renderResponse)}
      <Button onClick={() => setInsightsModal("prompt")}>Explore Prompt</Button>
    </Stack>
  }

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }


  function TabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{p: 3}}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  function BasicTabs() {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
    };

    return (
      <Box sx={{width: '100%'}}>
        <Box sx={{width: '100%', bgcolor: 'transparent'}}>
          <Tabs value={value} onChange={handleChange} centered>
            <Tab label="Prompt"/>
            <Tab label="Info"/>
            <Tab label="History"/>
          </Tabs>

        </Box>
        <TabPanel value={value} index={0}>
          <PromptTab1/>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <PromptTab2/>
        </TabPanel>

        <TabPanel value={value} index={2}>
          Prompt history
        </TabPanel>

      </Box>
    );
  }

  function renderModal() {
    return <Box
      sx={{mt: 2}}>
      <Typography
        variant="h5"
        alignItems='flex-start'
        sx={{mb: 2}}
      >
        Prompt
      </Typography>

      <BasicTabs/>
    </Box>
  }


  function PromptTab1() {
    return <Stack spacing={2} component="form">

      <FormControl fullWidth>
        <InputLabel
          id="demo-simple-select-label">Presets</InputLabel>
        <Select
          sx={{borderRadius}}
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={preset}
          label="Presets"
          onChange={changePreset as any}
        >
          {prompts.map(({key, label}) => (
            <MenuItem
              key={key} value={key}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        sx={{
          '& fieldset': {
            borderRadius,
          },
        }}
        id="outlined-multiline-flexible"
        label="Prompt"
        multiline
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        maxRows={4}
        // helperText="Enter a prompt, with <placeholder> values like so: Interpret the following dream <paragraphs>"
      />


      <Button
        sx={{elevation: 12}}
        variant="contained"
        color="secondary"
        disabled={trips.waiting}
        onClick={submit}
      >
        {trips.waiting ? <CircularProgress/> : "Submit"}
      </Button>
      {trips.responses.map(renderResponse)}

      <Box>
        <Grid container
          direction='row'
          marginTop={5}
          spacing={4}
          >
          <Grid item
            xs={12} md={6}
            alignItems='center'
            justifyItems='flex-start'
            >
            <Card
                 sx={{
                   display: 'inline-block',
                   transform: 'scale(0.8)',
                   backgroundColor: '#C3C7CC',
                   borderRadius: 3
                  }}
                  >
              <CardContent>
                  <Typography
                    textAlign='left'>
                Question:
              </Typography>
                <Typography
                textAlign='left'
                fontStyle='italic'
                >
                I have a lot to say so I'm going to say it here and see how it all goes.
              </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item
            xs={12} md={6}
            alignItems='center'
            justifyItems='flex-end'
            >
            <Card
              sx={{
               display: 'inline-block',
               transform: 'scale(0.8)',
                mt: 8,
                backgroundColor: '#ffffff',
                borderRadius: 3
              }}
              >
              <CardContent>
                  <Typography
                textAlign='left'>
                Answer:
              </Typography>
                 <Typography
                textAlign='left'
                fontStyle='italic'
                >
                I have a lot to say so I'm going to say it here and see how it all goes.
              </Typography>
              </CardContent>
            </Card>



          </Grid>

        </Grid>
      </Box>

    </Stack>
  }




  function PromptTab2() {
    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange =
      (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
      };

      return ( <div>
          <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Typography sx={{width: '33%', flexShrink: 0}}>
                The basics
              </Typography>
              <Typography sx={{color: 'text.secondary'}}>
                Find out more about how Prompt works
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Nulla facilisi. Phasellus sollicitudin nulla et quam mattis feugiat.
                Aliquam eget maximus est, id dignissim quam.
              </Typography>
            </AccordionDetails>

          </Accordion>
          <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls="panel2bh-content"
              id="panel2bh-header"
            >
              <Typography sx={{width: '33%', flexShrink: 0}}>
                Using placeholders
              </Typography>
              <Typography sx={{color: 'text.secondary'}}>
                Learn how to use placeholders in your prompts
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Donec placerat, lectus sed mattis semper, neque lectus feugiat lectus,
                varius pulvinar diam eros in elit. Pellentesque convallis laoreet
                laoreet.
              </Typography>
            </AccordionDetails>

          </Accordion>
          <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls="panel3bh-content"
              id="panel3bh-header"
            >
              <Typography sx={{width: '33%', flexShrink: 0}}>
                Custom prompts
              </Typography>
              <Typography sx={{color: 'text.secondary'}}>
                Get info about creating your own prompts
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer sit
                amet egestas eros, vitae egestas augue. Duis vel est augue.
              </Typography>
            </AccordionDetails>

            </Accordion>
          <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls="panel3bh-content"
              id="panel3bh-header"
            >
              <Typography sx={{width: '33%', flexShrink: 0}}>
                Tutorials
              </Typography>
              <Typography sx={{color: 'text.secondary'}}>
                Watch videos and read more about Prompt
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer sit
                amet egestas eros, vitae egestas augue. Duis vel est augue.
              </Typography>
            </AccordionDetails>

          </Accordion>


        </div>
      );
    }


    if (teaser) {
      return renderTeaser()
    }
    return renderModal()
    }


