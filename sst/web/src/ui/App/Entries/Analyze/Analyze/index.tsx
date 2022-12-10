
import Summarize from "./Summarize"
// import Ask from "./Ask"
import Themes from "./Themes"
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
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Card from '@mui/material/Card'
import {Alert2, ToolbarHeader} from "@gnothi/web/src/ui/Components/Misc";
import {Stack2} from "../../../../Components/Misc";

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


export default function Analyze() {
  const selectedTags = useStore(s => s.selectedTags)
  const filters = useStore(s => s.filters)
  const entries = useStore(s => s.res.entries_list_response)
  const res = useStore(s => s.res.analyze_get_response)
  const send = useStore(s => s.send)

  useEffect(() => {
    const filters_ = {
      ...filters,
      tags: selectedTags
    }
    send("analyze_get_request", filters_)
  }, [filters])

  if (!entries?.ids?.length) {
    return <Alert2 severity='warning'>
      <FaLock /> Not enough entries to work with. Add an entry or adjust the filters
    </Alert2>
  }

  if (res?.res?.code === 403) {
    return <h5>{res.res.data}</h5>
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
      label="Books"
      icon={<BooksIcon />}
      description="Book recommendations based on your entries."
    >
      <Books />
    </Insight>
  </Stack2>
}
