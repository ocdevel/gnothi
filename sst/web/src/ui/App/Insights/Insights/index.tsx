
import Summarize from "./Summarize"
// import Ask from "./Ask"
import Themes from "./Themes"
import Prompt from "./Prompt"
import Books from "./Books"
import Behaviors from "./Behaviors"

import {
  FaLock
} from "react-icons/fa"

import React, {useState, useEffect, useCallback} from "react"
import {useStore} from "@gnothi/web/src/data/store"


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

// 62da7182: books attrs, popovers
const iconProps = {
  size: 40,
  color: "primary"
} as const

interface Insight {
  label: string
  icon: React.ReactNode
  description: string
  children: React.ReactNode
}
function InsightCardHeader({label, icon, description, children}: Insight) {
  const title = <Stack
    alignItems="center"
    direction="row"
    spacing={2}
  >
    {icon}
    <Typography variant="h6" >{label}</Typography>
  </Stack>
  return <Card className='mb-3'>
    <CardHeader
      title={title}
      subheader={description}
    />
    <CardContent>
      {children}
    </CardContent>
  </Card>
}
function InsightRaw({label, icon, description, children}: Insight) {
  return <Card
    sx={{backgroundColor:'white', borderRadius: 2}}
  >
    <CardContent>
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
      >
        {icon}
        <Typography 
          variant="subtitle2" 
          color="primary.main"
          >{label}
          </Typography>
      </Stack>
      <Typography 
        color="primary.main" 
        variant="body2"
        fontWeight={300}
        >{description}
        </Typography>
    </CardContent>
    <CardContent>
      {children}
    </CardContent>
  </Card>
}

// const Insight = InsightCardHeader
const Insight = InsightRaw


interface Insights {
  entry_ids: string[]
}
export default function Insights({entry_ids}: Insights) {
  const search = useStore(s => s.filters.search)
  const send = useStore(useCallback(s => s.send, []))
  const view = entry_ids.length === 1 ? entry_ids[0] : "list"

  useEffect(() => {
    if (!entry_ids?.length) {return}

    // Logging each time this is called, since it's getting called a lot and I can't figure out why
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
  }, [search, entry_ids])

  // FIXME handle on a per-insight basis
  // if (!entry_ids?.length) {
  //   return <Alert2 severity='warning'>
  //     <FaLock /> Not enough entries to work with. Add an entry or adjust the filters
  //   </Alert2>
  // }

  return <div className="insights">
    <Stack2>
    <Insight
        label="Prompt"
        icon={<PromptIcon {...iconProps} />}
        description="Ask Gnothi anything about an entry or set of entries. Choose a topic and question, or create a custom prompt."
      >
        <Prompt entry_ids={entry_ids} view={view} />
      </Insight>

      <Insight
        label="Themes"
        icon={<ThemesIcon {...iconProps} />}
        description="See the recurring themes across your entries that AI sees. Use these to identify patterns in your thoughts and feelings. "
      >
        <Themes view={view}/>
      </Insight>

      <Insight
        label="Summary"
        icon={<SummaryIcon {...iconProps} />}
        description="This is an AI-generated summary based on your search results. You can adjust filters to see different summaries.
        "
      >
        <Summarize view={view} />
      </Insight>

      
      
      <Insight
        label="Books"
        icon={<BooksIcon {...iconProps} />}
        description="Gnothi recommends the following books to you based on the entries in this search. You can thumbs up or down books to train AI on your interests, or add titles you’re interested in to your bookshelf."
      >
        <Books view={view}/>
      </Insight>
      <Insight
        label="Behavior Tracking"
        icon={<BehaviorsIcon {...iconProps} />}
        description="Here’s an overview of the daily habits and behaviors you’ve been tracking through Gnothi."
      >
        <Behaviors/>
      </Insight>
    </Stack2>
  </div>
}
