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

import Tabs from "../../../Components/Tabs"
import Accordions from "../../../Components/Accordions"
import dayjs, {Dayjs} from "dayjs";
import create from "zustand/esm";
import {iso} from "../../Fields/store";


// type Preset = keyof typeof promptsObj
const PRESETS_URL = "https://gist.githubusercontent.com/lefnire/57023741c902627064e7d24302aa402f/raw/prompts.json"
// Comes from PRESETS_URL
type Preset = {
  key: string
  label: string
  prompt: string
}

interface PromptStore {
  presets: Preset[]
  setPresets: (presets: Preset[]) => void
  selectedPreset: string
  selectPreset: (e: React.ChangeEvent<HTMLInputElement>) => void

  prompt: string // current prompt, whether populated from a preset or typing
  setPrompt: (prompt: string) => void // set the prompt string from the textfield
  addPrompt: (prompt: string) => void // add a prompt to the history
  prompts: string[] // history of send prompts

  waiting: boolean // is it waiting for a response from the server

  responses: S.Insights.insights_prompt_response[] // history of OpenAI responses
  addResponse: (response: S.Insights.insights_prompt_response) => void // add a response to the history
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  // start with just blank prompt, will populate other prompts via HTTP -> Gist
  presets: [{
    "key": "blank",
    "label": "Blank",
    "prompt": ""
  }],
  setPresets: (presets) => set({presets}),
  selectedPreset: "blank",
  selectPreset: (e) => {
    const preset = e.target.value
    const presetsObj = keyBy(get().presets, 'key')
    set({
      selectedPreset: preset,
      prompt: presetsObj[preset].prompt
    })
  },

  prompt: "",
  setPrompt: (prompt: string) => set({prompt}),
  addPrompt: () => {
    const {prompts, prompt} = get()
    if (!prompt?.length) {return}
    if (prompts.length === 1) {
      // replace the sample prompt/response with this actual one
      set({
        waiting: true,
        prompts: [prompt],
        responses: [],
      })
    } else {
      set({
        waiting: true,
        prompts: [...get().prompts, prompt]
      })
    }
  },
  prompts: [],

  waiting: false,

  responses: [],
  addResponse: (response: S.Insights.insights_prompt_response) => {
    set({
      waiting: false,
      responses: [...get().responses, response]
    })
  },
}))

type PromptProps = Insight & {
  entry_ids: string[]
}

interface PromptChildProps {
  submit: () => void
  renderPresets: () => JSX.Element
}

const borderRadius = 3

function PromptTeaser({entry_ids, view}: PromptProps) {
  const insightsModal = useStore(s => s.insightsModal)
  const teaser = insightsModal === null
  const setInsightsModal = useStore(s => s.setInsightsModal)
  // TODO useStore version of loading
  const send = useStore(useCallback(s => s.send, []))
  const presets = usePromptStore(useCallback(s => s.presets, []))
  const setPresets = usePromptStore(useCallback(s => s.setPresets, []))
  const prompt = usePromptStore(useCallback(s => s.prompt, []))
  const setPrompt = usePromptStore(useCallback(s => s.setPrompt, []))
  const presetsObj = keyBy(presets, 'key')
  const selectPreset = usePromptStore(useCallback(s => s.selectPreset, []))
  const selectedPreset = usePromptStore(useCallback(s => s.selectedPreset, []))
  const prompts = usePromptStore(useCallback(s => s.prompts, []))
  const responses = usePromptStore(useCallback(s => s.responses, []))
  const waiting = usePromptStore(useCallback(s => s.waiting, []))
  const addPrompt = usePromptStore(useCallback(s => s.addPrompt, []))

  const [showHelp, setShowHelp] = useState<boolean>(false)

  const promptResponse = useStore(s => s.res.insights_prompt_response?.hash?.[view])
  const addResponse = usePromptStore(useCallback(s => s.addResponse, []))

  useEffect(() => {
    if (!promptResponse) {
      return
    }
    addResponse(promptResponse)
  }, [promptResponse])

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
        value={selectedPreset}
        label="Presets"
        onChange={selectPreset as any}
      >
        {presets.map(({key, label}) => (
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
        disabled={waiting}
        onClick={submit}
      >
        {waiting ? <CircularProgress/> : "Submit"}
      </Button>
    </Box>
    <Button onClick={() => setInsightsModal("prompt")}>Explore Prompt</Button>
  </Stack>
}

function PromptModal({entry_ids, view}: PromptProps) {
  const insightsModal = useStore(s => s.insightsModal)
  const teaser = insightsModal === null
  const setInsightsModal = useStore(s => s.setInsightsModal)
  // TODO useStore version of loading
  const send = useStore(useCallback(s => s.send, []))
  const presets = usePromptStore(useCallback(s => s.presets, []))
  const setPresets = usePromptStore(useCallback(s => s.setPresets, []))
  const prompt = usePromptStore(useCallback(s => s.prompt, []))
  const setPrompt = usePromptStore(useCallback(s => s.setPrompt, []))
  const presetsObj = keyBy(presets, 'key')
  const selectPreset = usePromptStore(useCallback(s => s.selectPreset, []))
  const selectedPreset = usePromptStore(useCallback(s => s.selectedPreset, []))
  const prompts = usePromptStore(useCallback(s => s.prompts, []))
  const responses = usePromptStore(useCallback(s => s.responses, []))
  const waiting = usePromptStore(useCallback(s => s.waiting, []))
  const addPrompt = usePromptStore(useCallback(s => s.addPrompt, []))

  const [showHelp, setShowHelp] = useState<boolean>(false)

  function PromptTab0() {
    return <Stack spacing={2} component="form">

      <FormControl fullWidth>
        <InputLabel
          id="demo-simple-select-label">Presets</InputLabel>
        <Select
          sx={{borderRadius}}
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={selectedPreset}
          label="Presets"
          onChange={selectPreset as any}
        >
          {presets.map(({key, label}) => (
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
        disabled={waiting}
        onClick={submit}
      >
        {waiting ? <CircularProgress/> : "Submit"}
      </Button>
      {responses.map(renderResponse)}

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


export default function Prompt({entry_ids, view}: PromptProps) {
  const insightsModal = useStore(s => s.insightsModal)
  const teaser = insightsModal === null
  const setInsightsModal = useStore(s => s.setInsightsModal)
  // TODO useStore version of loading
  const send = useStore(useCallback(s => s.send, []))
  const presets = usePromptStore(useCallback(s => s.presets, []))
  const setPresets = usePromptStore(useCallback(s => s.setPresets, []))
  const prompt = usePromptStore(useCallback(s => s.prompt, []))
  const setPrompt = usePromptStore(useCallback(s => s.setPrompt, []))
  const presetsObj = keyBy(presets, 'key')
  const selectPreset = usePromptStore(useCallback(s => s.selectPreset, []))
  const selectedPreset = usePromptStore(useCallback(s => s.selectedPreset, []))
  const prompts = usePromptStore(useCallback(s => s.prompts, []))
  const responses = usePromptStore(useCallback(s => s.responses, []))
  const waiting = usePromptStore(useCallback(s => s.waiting, []))
  const addPrompt = usePromptStore(useCallback(s => s.addPrompt, []))

  const [showHelp, setShowHelp] = useState<boolean>(false)

  async function fetchPresets() {
    // was already fetched, don't re-fetch till browser refresh
    if (presets.length > 1) {return}
    const {data} = await axios.get(PRESETS_URL)
    setPresets(data as Preset[])
  }

  useEffect(() => {
    fetchPresets()
  }, [])


  function submit() {
    addPrompt()
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
    const prompt = prompts[i]
    const res = responses[i]

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

  if (teaser) {
    return <PromptTeaser entry_ids={entry_ids} view={view} submit={submit} renderResponses={renderResponses}/>
  }
  return <PromptModal />
}


