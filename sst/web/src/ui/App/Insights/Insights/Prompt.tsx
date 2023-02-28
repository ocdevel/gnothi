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

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Tabs from "../../../Components/Tabs"
import Accordions from "../../../Components/Accordions"

// type Preset = keyof typeof promptsObj
type Preset = {
  key: string
  label: string
  prompt: string
}


type Prompt = Insight & {
  entry_ids: string[]
}


export default function Prompt({entry_ids, view}: Prompt) {
  const insightsModal = useStore(s => s.insightsModal)
  const teaser = insightsModal === null
  const setInsightsModal = useStore(s => s.setInsightsModal)
  const promptTrips = useStore(s => s.promptTrips)
  const setPromptTrips = useStore(s => s.setPromptTrips)
  // TODO useStore version of loading
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
    setPromptTrips({
      ...promptTrips,
      waiting: false,
      responses: [...promptTrips.responses, promptResponse]
    })
  }, [promptResponse])

  const changePreset: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const preset = e.target.value
    setPreset(preset)
    setPrompt(promptsObj[preset].prompt)
  }

  function submit() {
    setPromptTrips({
      ...promptTrips,
      waiting: true,
      prompts: [...promptTrips.prompts, prompt]
    })
    send("insights_prompt_request", {
      view,
      entry_ids,
      prompt
    })
    if (teaser) {
      setInsightsModal('prompt')
    }
  }

  function renderResponse(
    _: any,
    i: number
  ) {
    const prompt = promptTrips.prompts[i]
    const res = promptTrips.responses[i]

    return <Grow
      in={true}
      key={res.id}
      style={{transformOrigin: '0 0 0'}}
      timeout={1000}
    >
      <Grid
        container
        direction='row'
        marginTop={5}
        spacing={4}
      >
        <Grid
          item
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
                {prompt}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          item
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
                {res.response}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
          disabled={promptTrips.waiting}
          onClick={submit}
        >
          {promptTrips.waiting ? <CircularProgress/> : "Submit"}
        </Button>
      </Box>
      <Button onClick={() => setInsightsModal("prompt")}>Explore Prompt</Button>
    </Stack>
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

      <Tabs
        tabs={[
          {value: "0", label: "Prompt", render: () => <PromptTab0 />},
          {value: "1", label: "Info", render: () => <PromptTab1 />},
          {value: "2", label: "History", render: () => <PromptTab2 />},

        ]}
        defaultTab="0"
      />
    </Box>
  }


  function PromptTab0() {
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
        disabled={promptTrips.waiting}
        onClick={submit}
      >
        {promptTrips.waiting ? <CircularProgress/> : "Submit"}
      </Button>
      {promptTrips.responses.map(renderResponse)}

    </Stack>
  }


  function PromptTab1() {
    return <Accordions
      accordions={[{
        title: "The basics",
        subtitle: "Find out more about how Prompt works",
        content: <Typography>
          Nulla facilisi. Phasellus sollicitudin nulla et quam mattis feugiat.
          Aliquam eget maximus est, id dignissim quam.
        </Typography>
      }, {
        title: "Using placeholders",
        subtitle: "Learn how to use placeholders in your prompts",
        content: <Typography>
          Donec placerat, lectus sed mattis semper, neque lectus feugiat lectus,
          varius pulvinar diam eros in elit. Pellentesque convallis laoreet
          laoreet.
        </Typography>
      }, {
        title: "Custom prompts",
        subtitle: "Get info about creating your own prompts",
        content: <Typography>
          Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer sit
          amet egestas eros, vitae egestas augue. Duis vel est augue.
        </Typography>
      }, {
        title: "Tutorials",
        subtitle: "Watch videos and read more about Prompt",
        content: <Typography>
          Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer sit
          amet egestas eros, vitae egestas augue. Duis vel est augue.
        </Typography>
      }]}
    />
  }

  function PromptTab2() {
    return <>Prompt history</>
  }


  if (teaser) {
    return renderTeaser()
  }
  return renderModal()
}


