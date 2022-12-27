import React, {useState, useEffect} from 'react'

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

export default function Prompt() {
  const submitted = false // useStore(s => !!s.res.analyze_get_response?.first)
  const promptResponse = useStore(s => s.res.analyze_prompt_response)
  const filters = useStore(s => s.filters)
  const [preset, setPreset] = useState("")
  const [prompt, setPrompt] = useState("")
  const [showHelp, setShowHelp] = useState(false)

  // const waiting = !prompt?.first && submitted
  //
  // if (waiting) {
  //   return <LinearProgress />
  // }

  function changePreset(preset: string) {
    setPreset(preset)
    const prompts = {
      "dream": "Interpret the following dreams: <paragraphs>",
      "advice": "What advice would you have for someone who wrote the following: <summary>",
      "books": "What books would you recommend for someone who wrote the following: <summary>",
      "podcasts": "What books would you recommend for someone who wrote the following: <summary>",
    }
    setPrompt(prompts[preset])
  }

  return <Stack spacing={2} component="form">

    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">Presets</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={preset}
        label="Presets"
        onChange={e => changePreset(e.target.value)}
      >
        <MenuItem value="dream">Dream interpretation</MenuItem>
        <MenuItem value="advice">Life advice</MenuItem>
        <MenuItem value="books">Books</MenuItem>
        <MenuItem value="podcasts">Podcasts</MenuItem>
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

    <Button variant="contained" color="primary">Submit</Button>
  </Stack>

  // if (!prompt?.first) {
  //   return <Typography>Nothing to summarize (try adjusting date range)</Typography>
  // }
  //
  // // sent2face(reply_.sentiment)} {reply_.summary}
  // return <Typography>{summary.first.summary}</Typography>
}
