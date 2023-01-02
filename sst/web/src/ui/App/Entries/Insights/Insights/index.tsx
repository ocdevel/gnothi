
import Summarize from "./Summarize"
// import Ask from "./Ask"
import Themes from "./Themes"
import Prompt from "./Prompt"
import Books from "./Books"
import {
  FaCubes as ThemesIcon,
  FaQuestion,
  FaTags,
  FaTextHeight as SummarizeIcon,
  FaLock
} from "react-icons/fa"

import React, {useState, useEffect} from "react"
import {useStore} from "@gnothi/web/src/data/store"
import BooksIcon from "@mui/icons-material/MenuBook";
import PromptIcon from '@mui/icons-material/Quickreply';
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import {Stack2, Alert2} from "../../../../Components/Misc";

// 62da7182: books attrs, popovers

interface Insight {
  label: string
  icon: React.ReactNode
  description: string
  children: React.ReactNode
}
function Insight({label, icon, description, children}: Insight) {
  return <Card className='mb-3'>
    <CardHeader
      title={<>{icon} {label}</>}
      subtitle={description}
    />
    <CardContent>
      {children}
    </CardContent>
  </Card>
}


export default function Insights() {
  const entriesRes = useStore(s => s.res.entries_list_response?.res)
  const entries = useStore(s => s.res.entries_list_filtered)

  if (!entries?.ids?.length) {
    return <Alert2 severity='warning'>
      <FaLock /> Not enough entries to work with. Add an entry or adjust the filters
    </Alert2>
  }

  if (entriesRes?.error && entriesRes.code === 403) {
    return <h5>{entriesRes.data}</h5>
  }

  return <Stack2>
    <Insight
      label="Summarize"
      icon={<SummarizeIcon />}
      description="Summarize your entries for an overview."
    >
      <Summarize />
    </Insight>
    <Insight
      label="Themes"
      icon={<ThemesIcon />}
      description="Show common recurring themes across your entries."
    >
      <Themes />
    </Insight>
    <Insight
      label="Prompt"
      icon={<PromptIcon />}
      description="Prompts"
    >
      <Prompt />
    </Insight>
    <Insight
      label="Books"
      icon={<BooksIcon />}
      description="Book recommendations based on your entries."
    >
      <Books />
    </Insight>
  </Stack2>
}
