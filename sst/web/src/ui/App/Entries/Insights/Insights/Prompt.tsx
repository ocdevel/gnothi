import React, {useState, useEffect, useCallback} from 'react'

import {useStore} from "@gnothi/web/src/data/store"
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

const prompts = [
  {
    key: "blank",
    label: "Blank",
    prompt: "",
  },
  {
    key: "dream",
    label: "Dream interpretation",
    prompt: "Interpret the following dreams: <paragraphs>"
  },
  {
    key: "advice",
    label: "Life Advice",
    prompt: "What advice would you have for someone who wrote the following: <summary>",
  },
  {
    key: "books",
    label: "Book recommends",
    prompt: "What books would you recommend for someone who wrote the following: <summary>",
  },
  {
    key: "podcasts",
    label: "Podcast recommends",
    prompt: "What podcasts would you recommend for someone who wrote the following: <summary>",
  }
] as const
const promptsObj = keyBy(prompts, 'key')
type Preset = keyof typeof promptsObj

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
  const [preset, setPreset] = useState<Preset>("")
  const [prompt, setPrompt] = useState<string>("")
  const [showHelp, setShowHelp] = useState<boolean>(false)

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
      prompts: [...trips.prompts, prompt]
    })
    console.log("prompt", entry_ids)
    send("insights_prompt_request", {
      view,
      entry_ids,
      prompt
    })
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
    <Divider />
    {trips.responses.map((res, i) => <div key={i}>
      <Typography>Q: {trips.prompts[i]}</Typography>
      <Typography>A: {res.response}</Typography>
      <Divider />
    </div>)}
  </Stack>
}
