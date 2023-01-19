import React, {useState, useEffect, useCallback} from 'react'

import {useStore} from "@gnothi/web/src/data/store"
import axios from "axios"
import Typography from "@mui/material/Typography";
import {LinearProgress} from "@mui/material";
import Box from "@mui/material/Box";
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

// type Preset = keyof typeof promptsObj
type Preset = string

type Prompt = Insight & {
  entry_ids: string[]
}
export default function Prompt({entry_ids, view}: Prompt) {
  // TODO useStore version of loading
  const [trips, setTrips] = useState<{
    waiting: boolean
    responses: S.Insights.insights_prompt_response[],
    prompts: string[]
  }>({
    prompts: [],
    responses: [],
    waiting: false,
  })
  const send = useStore(useCallback(s => s.send, []))
  const promptResponse = useStore(s => s.res.insights_prompt_response?.hash?.[view])
  // start with just blank prompt, will populate other prompts via HTTP -> Gist
  const [prompts, setPrompts] = useState<any>([{
    "key": "blank",
    "label": "Blank",
    "prompt": ""
  }])
  const [preset, setPreset] = useState<Preset>("")
  const [prompt, setPrompt] = useState<string>("")
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const promptsObj = keyBy(prompts, 'key')

  async function getPrompts() {
    const promptsUrl = "https://gist.githubusercontent.com/lefnire/57023741c902627064e7d24302aa402f/raw/prompts.json"
    const {data} = await axios.get(promptsUrl)
    setPrompts(data)
  }
  useEffect(() => {
    getPrompts()
  }, [])

  useEffect(() => {
    if (!promptResponse) {return}
    setTrips({
      ...trips,
      waiting: false,
      responses: [...trips.responses, promptResponse]
    })
  }, [promptResponse])

  const changePreset: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const preset = e.target.value as Preset
    setPreset(preset)
    setPrompt(promptsObj[preset].prompt)
  }

  function submit() {
    setTrips({
      ...trips,
      waiting: true,
      prompts: [prompt, ...trips.prompts]
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
      style={{ transformOrigin: '0 0 0' }}
      timeout={1000}
    >
      <Box>
        <Typography>Q: {prompt}</Typography>
        <Typography>A: {res.response}</Typography>
        <Divider />
      </Box>
    </Grow>
  }

  return <Stack spacing={2} component="form">

    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">Presets</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={preset}
        label="Presets"
        onChange={changePreset as any}
      >
        {prompts.map(({key, label}) => (
          <MenuItem key={key} value={key}>{label}</MenuItem>
        ))}
      </Select>
    </FormControl>


    <TextField
      id="outlined-multiline-flexible"
      label="Prompt"
      multiline
      value={prompt}
      onChange={e => setPrompt(e.target.value)}
      maxRows={4}
      helperText="Enter a prompt, with <placeholder> values like so: Interpret the following dream <paragraphs>"
    />

    <Button onClick={() => setShowHelp(!showHelp)}>{showHelp ? "Hide help" : "Show Help"}</Button>
    {showHelp && <Typography>
      Legend. The following placeholders are supported in your prompt:
      <ul>
        <li>&lt;entry&gt; - Uses your entire entry as the context for the prompt. Use with caution, as there's a max number of characters that OpenAI can take as input. If you exceed, your entry will be truncated. If you know your entry is short enough, use this. Otherwise, use &lt;paragraphs&gt; or &lt;summary&gt;</li>
        <li>&lt;paragraphs&gt; - Runs the prompt independently for each paragraph in your entry </li>
        <li>&lt;summary&gt; - Runs the prompt over the summary of your entry. Ideal for longer entries, where the context should capture the essence of your entry (rather than the specifics).</li>
      </ul>
    </Typography>}

    <Button
      variant="contained"
      color="primary"
      disabled={trips.waiting}
      onClick={submit}
    >
      {trips.waiting ? <CircularProgress /> : "Submit"}
    </Button>
    {trips.responses.map(renderResponse)}
  </Stack>
}
