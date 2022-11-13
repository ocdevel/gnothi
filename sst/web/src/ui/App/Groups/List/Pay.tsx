import { FullScreenDialog } from "../../../Components/Dialog";
import Grid from "@mui/material/Grid";
import Chip from '@mui/material/Chip'
import React, {useState} from 'react'
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";
import {theme} from '../../../Setup/Mui'

const SPACING = 5

const EA = null // <Chip label="Early Access"></Chip>

const premium = {
  done: [
    {
      title: "QA",
      body: <div>
        {EA} Ask Gnothi anything about your journal entries. We've moved this into Early Access while we work to safeguard its outputs.
      </div>
    },
    {
      title: "Image Generation",
      body: <div>
        {EA} Have AI generate an image to go along with your journal entry.
      </div>
    },
    {
      title: "Prompt",
      body: <div>
        {EA} Interact with AI in any way you like. Sounds vague? It is vague. Literally you just talk to this thing, and it uses your entries and does something. I don't know!
      </div>
    },
    {
      title: "Groups v1",
      body: <div>
        <div>{EA} Groups is coming. You'll be able to create and join mental health networks where you can support each other. Features will include chat, entry-sharing, video sessions, and more.</div>
        <div>This version includes:
          <ul>
            <li>Create/join (member-charging is currently disabled)</li>
            <li>Chat</li>
            <li>Entry-sharing</li>
          </ul>
        </div>
      </div>
    }
  ],
  soon: [
    {
      title: "Groups v2",
      body: <div>
        {EA} This will be released very soon. It will include: <ul>
        <li>Charge members (optionally, and/or as suggested donations) for per-feature group usage</li>
        <li>Scheduled video sessions with the whole group</li>
      </ul>
      </div>
    },
    {
      title: "Dreams",
      body: <div>
        {EA} AI auto interprets your dreams
      </div>
    }

  ],
  later: [
    {
      title: "Import/export",
      body: <div>Import journals from other platforms; export to .md / .pdf</div>
    },
    {
      title: "Groups v3",
      body: <div>
        {EA}
        <ul>
          <li>Private video sessions. Consider using this as a mental health professional</li>
        </ul>
      </div>
    },
  ]
}

type Timeframe = "soon" | "done" | "later"
function Feature({title, body, timeframe}: {title: string, body: React.ReactNode, timeframe: Timeframe}) {
  const styles = {
    opacity: timeframe === 'done' ? 1 : timeframe === 'soon' ? .6 : .3
  }
  return <Grid item xs={12} sm={6} md={4}>
    <Card raised sx={{height: "100%", ...styles}}>
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography>{body}</Typography>
      </CardContent>
    </Card>
  </Grid>
}

type Section = {title: string, children: React.ReactNode, timeframe: Timeframe}
function Section({title, children, timeframe}: Section) {
  return <Box>
    <Box sx={{my: SPACING}}>
      <Typography variant="h4">{title}</Typography>
      <Typography>{children}</Typography>
    </Box>
    <Grid spacing={2} container>
      {premium[timeframe].map((feature, i) => <Feature {...feature} key={i} timeframe={timeframe} />)}
    </Grid>
  </Box>
}

export default function Pay() {
  const [show, setShow] = useState(true)
  const toggle = () => setShow(!show)

  
  return <FullScreenDialog open={show} title="Premium" onClose={toggle}>
    <Box sx={{m: SPACING}}>
      <Grid container sx={{mb:SPACING}}>
        <Grid item xs={3}></Grid>
        <Grid container item direction="column" xs={6} alignItems="center">
          <Grid item><Typography variant="h2">Premium</Typography></Grid>
          <Grid item><Typography>About premium. These features are {EA}. Some or most will come to the main service eventually. You're getting beta access to try sooner than most. We'll be fine-tuning these features before public availability.</Typography></Grid>
        </Grid>
        <Grid item xs={3}></Grid>
      </Grid>
      
      <Section title="v1" timeframe="done">
        About v1
      </Section>
      <Section title="Soon" timeframe="soon">
        About what's coming soon
      </Section><Section title="Later" timeframe="later">
        These are someday maybe
      </Section>
        
    </Box>
  </FullScreenDialog>
}
