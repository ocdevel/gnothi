import React, {useState, useEffect} from 'react'
import AppBar from '../../Components/AppBar'
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import {useStore} from "@gnothi/web/src/data/store"
import Typography from "@mui/material/Typography";
import {LinearProgress} from "@mui/material";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import {FullScreenDialog} from "../../Components/Dialog";

export default function ModalModal() {
  const [modal2, setModal2] = useState(false)
  return <div>
    <FullScreenDialog title={"Modal1"} open={true} onClose={() => {}}>
      <Typography>Modal 1 is open</Typography>
      <Button onClick={() => setModal2(true)}>Open Modal 2</Button>
    </FullScreenDialog>
    <FullScreenDialog title={"Modal2"} open={modal2} onClose={() => setModal2(false)}>
      <Typography>Modal 2 is open</Typography>
    </FullScreenDialog>
  </div>
}

function Prompt() {
  const submitted = false // useStore(s => !!s.res.insights_get_response?.first)
  const filters = useStore(s => s.filters)
  const [preset, setPreset] = useState("dream")
  const [model, setModel] = useState("text-davinci-003")
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
      "podcasts": "What podcasts would you recommend for someone who wrote the following: <summary>",
      "oneword": "What one word describes the following: <summary>",
      "tagline": "Write a tagline to describe the following: <summary>"
    }
    // for more examples, see https://beta.openai.com/examples
    setPrompt(prompts[preset])
  }


  return <Stack
    spacing={2}
    component="form"
    sx={{p: 5}}
  >
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

    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">Model</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={model}
        label="Model"
        onChange={e => setModel(e.target.value)}
      >
        <MenuItem value="text-davinci-003">davinci-003 (4096 tokens)</MenuItem>
        <MenuItem value="text-curie-001">curie-001 (2048 tokens?)</MenuItem>
        <MenuItem value="text-babbage-001">babbage-001 2048 tokens?)</MenuItem>
        <MenuItem value="text-ada-001">ada-001 (2048 tokens?)</MenuItem>
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
        <li>&lt;entry&gt; - Uses your entire entry as the context for the prompt. Use with caution, as there's a max number of <a target="_blank" href="https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them#:~:text=Token%20Limits,be%2097%20tokens%20at%20most.">tokens</a> (basically words) that OpenAI can take as input. It's somewhere between 512 and 4096 tokens. If you exceed, your entry will be truncated. If you know your entry is short enough, use this. Otherwise, use &lt;paragraphs&gt; or &lt;summary&gt;</li>
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


function AppBarSandbox() {
  const [bar, setBar] = useState<"app" | "splash" | "modal">("app")

  const app = {
    links: [
      {name: "Dashboard", to: "/"},
      {name: "Sharing", to: "/"},
      {name: "Resources", to: "/"},
    ],
    title: undefined,
    ctas: undefined,
    userMenu: true
  }

  const splash = {
    links: [],
    title: undefined,
    ctas: [
      {name: "Sign Up", fn: () => {}},
      {name: "Log In", fn: () => {}}
    ],
    userMenu: false
  }

  const modal = {
    links: [],
    title: "Sharing",
    ctas: [{
      name: "Save",
      fn: () => alert("Saved!")
    }],
    userMenu: false,
    onClose: () => alert("closed")
  }

  const journal = {
    links: [
      {name: "Dashboard", to: "/"},
      {name: "Sharing", to: "/"},
      {name: "Resources", to: "/"},
    ],
    title: undefined,
    ctas: [{
      name: "New Entry",
      fn: () => {}
    }],
    userMenu: true
  }

  const props = {
    app,
    splash,
    modal,
    journal
  }

  return <>
    <AppBar {...props[bar]} />
    <Toolbar />
    <Stack spacing={2} direction="row">
      {Object.keys(props).map(name => (
        <Button variant="contained" onClick={() => setBar(name)}>
          {name}
        </Button>
      ))}
    </Stack>
  </>
}
