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
import {Insight} from '../Utils'
import Grow from '@mui/material/Grow';

import Tabs from "../../../../Components/Tabs"
import Accordions from "../../../../Components/Accordions"
import Container from "@mui/material/Container";
import {FullScreenDialog} from "../../../../Components/Dialog";
import PromptSelector from './Selector.tsx'


type Prompt = Insight & {
  entry_ids: string[]
}

type Trips = {
  waiting: boolean
  responses: S.Insights.insights_prompt_response[]
  prompts: string[]
}

export default function Prompt({entry_ids, view}: Prompt) {
  const [modal, setModal] = useState(false)
  const [trips, setTrips] = useState<Trips>({
    waiting: false,
    prompts: [],
    responses: []
  })

  // TODO useStore version of loading
  const send = useStore(useCallback(s => s.send, []))
  const promptResponse = useStore(s => s.res.insights_prompt_response?.hash?.[view])
  // start with just blank prompt, will populate other prompts via HTTP -> Gist

  const [prompt, setPrompt] = useState<string>("")
  const [showHelp, setShowHelp] = useState<boolean>(false)
  const btnDisabled = trips.waiting || prompt.length < 3

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

  const submit = () => {
    // They didn't enter anything
    if (!prompt?.length) {return}

    setTrips({
      ...trips,
      waiting: true,
      prompts: [...trips.prompts, prompt]
    })
    send("insights_prompt_request", {
      view,
      entry_ids,
      prompt
    })
    if (!modal) {
      setModal(true)
    }
  }

  const renderResponse = (
    _: any,
    i: number
  ) => {
    const prompt = trips.prompts[i]
    const res = trips.responses[i]

    // return <Grow
    //   in={true}
    //   key={res.id}
    //   style={{transformOrigin: '0 0 0'}}
    //   timeout={1000}
    // >
    return <div key={res.id}>
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
    </div>
    // </Grow>
  }

  const borderRadius = 3

  function renderTeaser() {
    return <Stack
      spacing={2}
      component="form"
      alignItems='flex-end'>


      <PromptSelector prompt={prompt} setPrompt={setPrompt} />

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

      <Box>
        <Button
          sx={{elevation: 12, fontWeight: 500}}
          variant="outlined"
          size="small"
          color="secondary"
          disabled={btnDisabled}
          onClick={submit}
        >
          {trips.waiting ? <CircularProgress/> : "Submit"}
        </Button>
      </Box>
      <Button onClick={() => setModal(true)}>Explore Prompt</Button>
    </Stack>
  }

  function renderModal() {

    function tab0() {
      return <Stack spacing={2} component="form">
        <PromptSelector prompt={prompt} setPrompt={setPrompt} />

        <Button
          sx={{elevation: 12}}
          variant="contained"
          color="secondary"
          disabled={btnDisabled}
          onClick={submit}
        >
          {trips.waiting ? <CircularProgress/> : "Submit"}
        </Button>
        {trips.responses.map(renderResponse)}

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
        <Typography
          variant="h5"
          alignItems='flex-start'
          sx={{mb: 2}}
        >
          Prompt
        </Typography>

        <Tabs
          tabs={[
            {value: "0", label: "Prompt", render: tab0},
            {value: "1", label: "Info", render: tab1},
            {value: "2", label: "History", render: tab2},

          ]}
          defaultTab="0"
        />
      </Box>
    </Container>
  }

  return <>
    {!modal && renderTeaser()}
    <FullScreenDialog
      title=""
      open={!!modal}
      onClose={() => setModal(false)}
      ctas={[]}
      className="insights"
      backButton={true}
    >
      {renderModal()}
    </FullScreenDialog>
  </>
}


