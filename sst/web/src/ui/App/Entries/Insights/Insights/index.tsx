
import Summarize from "./Summarize"
// import Ask from "./Ask"
import Themes from "./Themes"
import Prompt from "./Prompt"
import Books from "./Books"

import {
  FaLock
} from "react-icons/fa"

import React, {useState, useEffect} from "react"
import {useStore} from "@gnothi/web/src/data/store"


import BooksIcon from "@mui/icons-material/MenuBook";
import PromptIcon from '@mui/icons-material/Quickreply';
import SummarizeIcon from '@mui/icons-material/FitScreen';
import ThemesIcon from '@mui/icons-material/OfflineBolt';

import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import {Stack2, Alert2} from "../../../../Components/Misc";
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
    <Typography variant="h6">{label}</Typography>
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
  return <Card sx={{backgroundColor:'white', borderRadius: 2}} className='mb-3'>
    <CardContent>
      <Stack
        alignItems="center"
        direction="row"
        spacing={2}
      >
        {icon}
        <Typography variant="h6">{label}</Typography>
      </Stack>
      <Typography color="secondary" variant="subtitle1">{description}</Typography>
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
  const send = React.useCallback(useStore(s => s.send), [])

  useEffect(() => {
    console.log('insights:useEffect', [search, entry_ids])
    if (!entry_ids?.length) {return}
    send("insights_get_request", {
      entry_ids,
      insights: {
        summarize: true,
        query: search,
        books: true,
        prompt: undefined
      }
    })
  }, [search, entry_ids])

  if (!entry_ids?.length) {
    return <Alert2 severity='warning'>
      <FaLock /> Not enough entries to work with. Add an entry or adjust the filters
    </Alert2>
  }

  return <Stack2>
    <Insight
      label="Summarize"
      icon={<SummarizeIcon {...iconProps} />}
      description="Summarize your entries for an overview."
    >
      <Summarize />
    </Insight>
    <Insight
      label="Themes"
      icon={<ThemesIcon {...iconProps} />}
      description="Show common recurring themes across your entries."
    >
      <Themes />
    </Insight>
    <Insight
      label="Prompt"
      icon={<PromptIcon {...iconProps} />}
      description="Prompts"
    >
      <Prompt />
    </Insight>
    <Insight
      label="Books"
      icon={<BooksIcon {...iconProps} />}
      description="Book recommendations based on your entries."
    >
      <Books />
    </Insight>
  </Stack2>
}
