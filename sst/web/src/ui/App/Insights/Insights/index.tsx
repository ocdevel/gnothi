
import Box from "@mui/material/Box"
import Summarize from "./Summarize"
// import Ask from "./Ask"
import Themes from "./Themes"
import Prompt from "./Prompt"
import Books from "./Books"
import Behaviors from "./Behaviors"
import Divider from "@mui/material/Divider";
import dayjs from 'dayjs'

const ENABLE_PROMPT = true

import {
  FaLock
} from "react-icons/fa"

import React, {useState, useEffect, useCallback} from "react"
import {useStore} from "../../../../data/store"


import BooksIcon from '@mui/icons-material/AutoStoriesOutlined';
import SummaryIcon from '@mui/icons-material/SummarizeOutlined';
import ThemesIcon from '@mui/icons-material/DashboardOutlined';
import BehaviorsIcon from '@mui/icons-material/InsertChartOutlinedRounded';
import PromptIcon from '@mui/icons-material/ChatOutlined';



import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import {Stack2, Alert2} from "../../../Components/Misc";
import Stack from "@mui/material/Stack"
import { Typography } from "@mui/material"
import {shallow} from "zustand/shallow";
import {useDebouncedCallback} from "use-debounce";

// 62da7182: books attrs, popovers
const iconProps = {
  size: 40,
  color: "primary"
} as const

interface Insight {
  label: string
  icon: React.ReactNode
  description?: string
  children: React.ReactNode
}

function Insight({label, icon, description, children}: Insight) {
  return <Card
    sx={{ backgroundColor:'white', borderRadius: 2, boxShadow: 1}}
  >
    <CardContent>
      <Stack
        alignItems="center"
        direction="row"
        spacing={1}
      >
        {icon}
        <Typography 
          variant="h4"
          fontWeight={500}
          textAlign={'center'}
          color="primary.main"
          >{label}
          </Typography>
      </Stack>
      {description && <Typography
        color="primary.main"
        variant="body2"
        fontWeight={300}
        >{description}
        </Typography> }
      {children}
    </CardContent>
  </Card>
}


interface Insights {
  entry_ids: string[]
}
export default function Insights({entry_ids}: Insights) {
  const [
    search,
    entriesHash,
    entryModal
  ] = useStore(s => [
    s.filters.search,
    s.res.entries_list_response?.hash || {},
    s.entryModal
  ], shallow)
  const send = useStore(useCallback(s => s.send, []))
  const view = entry_ids.length === 1 ? entry_ids[0] : "list"

  // git-blame: checks here to prevent requesting insights if not ready. Now instead I'm debouncing, and
  // letting the server decide.

  const getInsights = useDebouncedCallback(() => {
    // Logging each time this is called, until I'm sure our logic above is solid.
    console.log('insights:useEffect', [search, entry_ids])

    send("insights_get_request", {
      view,
      entry_ids,
      insights: {
        summarize: true,
        query: search,
        books: true,
        prompt: undefined
      }
    })
  }, 5000)

  useEffect(() => {
    if (!entry_ids.length) { return }
    getInsights()
  }, [search, entry_ids])

  // FIXME handle on a per-insight basis
  // if (!entry_ids?.length) {
  //   return <Alert2 severity='warning'>
  //     <FaLock /> Not enough entries to work with. Add an entry or adjust the filters
  //   </Alert2>
  // }

  return <div className="insights">
    <Stack2>
      {/*<Stack>*/}
      {/*  <Typography*/}
      {/*    variant="h4"*/}
      {/*    color="primary.main"*/}
      {/*    fontWeight={500}*/}
      {/*    mb={1}*/}
      {/*    mt={0}*/}
      {/*    textAlign='right'*/}
      {/*  >*/}
      {/*    AI Insights*/}
      {/*  </Typography>*/}
      {/*  /!*<Typography*!/*/}
      {/*  /!*  color="primary.main"*!/*/}
      {/*  /!*  variant="body1"*!/*/}
      {/*  /!*  fontWeight={300}*!/*/}
      {/*  /!*  mb={2}*!/*/}
      {/*  /!*>*!/*/}
      {/*  /!*  These are the results based on your search and the entries you’ve selected. You can adjust filters to see different insights.*!/*/}
      {/*  /!*</Typography>*!/*/}
      {/*</Stack>*/}

      {ENABLE_PROMPT && <Insight
        label="Prompt"
        icon={<PromptIcon {...iconProps} />}
        description="Ask Gnothi anything about an entry or set of entries. Choose a topic and question, or create a custom prompt."
      >
        <Prompt entry_ids={entry_ids} view={view} />
      </Insight>}

      <Insight
        label="Themes"
        icon={<ThemesIcon {...iconProps} />}
        // description="See the recurring themes across your entries that AI sees. Use these to identify patterns in your thoughts and feelings. "
      >
        <Themes view={view}/>
      </Insight>

      <Insight
        label="Summary"
        icon={<SummaryIcon {...iconProps} />}
        // description="This is an AI-generated summary based on your search results. You can adjust filters to see different summaries.
        // "
      >
        <Summarize view={view} />
      </Insight>

      {entryModal?.mode==="view" &&
      <Insight
        label="Behavior Tracking"
        icon={<BehaviorsIcon {...iconProps} />}
      //   description="Here’s an overview of the daily habits and behaviors you’ve been tracking through Gnothi."//
      >
        <Behaviors />
      </Insight>
      }
      <Insight
        label="Top Books"
        icon={<BooksIcon {...iconProps} />}
        // description="Gnothi recommends the following books to you based on the entries in this search." //You can thumbs up or down books to train AI on your interests, or add titles you’re interested in to your bookshelf."
      >
        <Books view={view}/>
      </Insight>

    </Stack2>
  </div>
}
