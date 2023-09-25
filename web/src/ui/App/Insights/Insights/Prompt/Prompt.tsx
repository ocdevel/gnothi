import React, {useState, useEffect, useCallback} from 'react'
import {useStore} from "../../../../../data/store"
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import {Insight} from '../Utils'

import Accordions from "../../../../Components/Accordions"
import Container from "@mui/material/Container";
import {FullScreenDialog} from "../../../../Components/Dialog";
import PromptSelector from './Selector.tsx'
import type {Message} from '@gnothi/schemas/insights'
import PremiumIcon from '@mui/icons-material/LockOutlined';
import {shallow} from "zustand/shallow";
import BtnTryGenerative from '../../../../Components/BtnTryGenerative'

// import {LinearProgress} from "@mui/material";
// import axios from "axios"
// import Grow from '@mui/material/Grow';
// import SettingsIcon from "@mui/icons-material/SettingsOutlined"
// import Tabs from "../../../../Components/Tabs"

type Prompt = Insight & {
  entry_ids: string[]
}

export default function Prompt({entry_ids, view}: Prompt) {
  const [
    me,
    modal,
    promptResponse,
    waiting,
    creditActive
  ] = useStore(s => [
    s.user?.me,
    s.modals.prompt,
    s.res.insights_prompt_final?.hash?.[view],
    s.req.insights_prompt_request,
    s.creditActive
  ], shallow)
  const [
    send,
    setModal,
  ] = useStore(useCallback(s => [
    s.send,
    s.modals.setPrompt,
  ], []))
  const [messages, setMessages] = useState<Message[]>([])
  const [model, setModel] = useState<"gpt-3.5-turbo-16k" | "gpt-4">("gpt-4")

  const [prompt, setPrompt] = useState<string>("")
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const btnDisabled = waiting || prompt.length < 3

  useEffect(() => {
    if (!promptResponse) { return }
    // The response comes back as the full chat history. Clobber what's here.
    setMessages(promptResponse.messages)
  }, [promptResponse])

  const submit = () => {
    // They didn't enter anything
    if (btnDisabled) {return}

    const message = {role: "user", content: prompt, id: Date.now().toString()}
    const updated = [...messages, message]
    setMessages(updated)
    const request = {
      generative: useStore.getState().creditActive,
      view,
      entry_ids,
      messages: updated,
      model
    }

    send("insights_prompt_request", request)
    if (!modal) {
      setPrompt("")
      setModal(true)
    }
  }

  function closeModal() {
    setMessages([])
    setModal(false)
  }

  function renderModelSelector() {
    // Ditching model-selector for now, just use GPT-4. When we have Llama 2, add this back
    return <div></div>
    return <Grid item>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          size="small"
          labelId="model-select-label"
          id="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          label="Model"
        >
          <MenuItem value="gpt-4">GPT4 - Slow, Wise</MenuItem>
          <MenuItem value="gpt-3.5-turbo-16k">GPT3 - Fast, Simple</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  }

  function renderSubmit() {
    return <Grid item>
      <BtnTryGenerative
        btnProps={{
          sx: {elevation: 12, fontWeight: 500},
          // variant: (modal ? "contained" : "outlined"),
          disabled: btnDisabled
        }}
        submit={submit}
        tryLabel={waiting ? <CircularProgress /> : "Try Prompt"}
        premiumLabel={waiting ? <CircularProgress/> : "Submit"}
      />
    </Grid>
  }

  function renderModelAndSubmit() {
    return <Grid container justifyContent="space-between" alignItems="center">
     {renderModelSelector()}
     {renderSubmit()}
    </Grid>
  }

  function renderMessage(message: Message, i: number) {
    // return <Grow
    //   in={true}
    //   key={res.id}
    //   style={{transformOrigin: '0 0 0'}}
    //   timeout={1000}
    // >
    const {role, content, id} = message
    return <Grid
      key={id}
      item
      xs={12}
      sx={{
        backgroundColor: role === "user" ? '#ffffff' : '#C3C7CC',
      }}
    >
      <CardContent>
        <Typography>
          {{
            system: "System",
            assistant: "Gnothi",
            user: "You"
          }[role]}
        </Typography>
        <Typography>
          {message.content}
        </Typography>
      </CardContent>
    </Grid>
  }

  function renderMessages() {
    const DEBUG = true

    const messages_ = messages
      .filter(m => DEBUG || m.role !== "system")
      // the user's entries are injected between triple-quotes, for easier prompt-engineering. Makes
      // it easy for us to remove it. We *could* show it, but it will be their full squashed entry history
      .filter(m => DEBUG || !m.content.startsWith(`"""`))
      .slice().reverse() // TODO gotta get chatbox at bottom, messages natural order
    return <Grid
      container
      direction='row'
      marginTop={5}
      borderRadius={3}
      spacing={2}
    >
      {messages_.map(renderMessage)}
    </Grid>
  }

  const borderRadius = 3

  function renderTeaser() {
    return <>
      <Stack
        spacing={2}
        component="form">

        <PromptSelector
          prompt={prompt}
          setPrompt={setPrompt}
        />

        {/*<Button onClick={() => setShowHelp(!showHelp)}>{showHelp ? "Hide help" : "Show Help"}</Button>
        {showHelp && <Typography>
          Legend. The following placeholders are supported in your prompt:
          <ul>
            <li>&lt;entry&gt; - Uses your entire entry as the context for the prompt. Use with caution, as there's a max
              number of characters that OpenAI can take as input. If you exceed, your entry will be truncated. If you know
              your entry is short enough, use this. Otherwise, use &lt;paragraphs&gt; or &lt;summary&gt;</li>
            <li>&lt;paragraphs&gt; - Runs the prompt independently for each paragraph in your entry</li>
            <li>&lt;summary&gt; - Runs the prompt over the summary of your entry. Ideal for longer entries, where the
              context should capture the essence of your entry (rather than the specifics).
            </li>
          </ul>
        </Typography>}*/}

        {renderModelAndSubmit()}
      </Stack>
    </>
  }

  function renderModal() {
    function tab0() {
      return <Stack spacing={2} component="form">
        <PromptSelector
          prompt={prompt}
          setPrompt={setPrompt}
        />

        {renderModelAndSubmit()}
        {renderMessages()}
      </Stack>
    }

    function tab1() {
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

    function tab2() {
      return <>Prompt history</>
    }

    return <Container maxWidth={false}>
      <Box
        sx={{mt: 2}}>
        {/*<Tabs
          tabs={[
            {value: "0", label: "Prompt", render: tab0},
            {value: "1", label: "Info", render: tab1},
            // {value: "2", label: "History", render: tab2},

          ]}
          defaultTab="0"
        />*/}
        {tab0()}
      </Box>
    </Container>
  }

  return <>
    {!modal && renderTeaser()}
    <FullScreenDialog
      title=""
      open={!!modal}
      onClose={closeModal}
      ctas={[]}
      className="insights"
      backButton={true}
    >
      {renderModal()}
    </FullScreenDialog>
  </>
}


