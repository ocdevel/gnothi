import {useStore} from "../../../data/store";
import React, {useState} from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import {FaRobot} from "react-icons/fa";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import _ from "lodash";
import {FullScreenDialog} from "../../Components/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import Sortable from "../../Components/Sortable";
import {create} from "./Create";
import Form from './Form'
import {Tags} from '@gnothi/schemas/tags'
import Stack from "@mui/material/Stack";

interface Modal {
  close: () => void
}
export default function Modal({close}: Modal) {
  const send = useStore(s => s.send)
  const tags = useStore(s => s.res.tags_list_response?.rows || [])
  const [showMore, setShowMore] = useState(false)

  function toggleMore() {setShowMore(!showMore)}

  function renderHelp() {
    return <Card>
      <CardHeader title='About Tags' />
      <CardContent>
        <Typography component="div">
          Tags organize your journal entries by topic (eg personal, work, dreams). Some apps do this via <em>multiple journals</em>, like folders on a computer. Gnothi uses tags instead, adding more flexibility for entry-sharing & AI.
        </Typography>
      </CardContent>
      <CardHeader
        title={
          <Stack alignItems="center" direction="row" spacing={2}>
            <Box>About</Box>
            <FaRobot />
          </Stack>
        }
      />
      <CardContent>
        <Typography component="div">
          Gnothi applies AI to your journal, which may be unwanted for certain entries. You can disable AI features for those entries via tags.
        </Typography>
        <Typography variant="h6">Index</Typography>
        <Typography component="div">
        When <em>enabled</em>, these entries "represent you" - this is called "indexing". They will be used for recommending books, groups, therapists, etc. A scenario you'd likely disable this is <strong>Dreams</strong>.
        </Typography>
        <Typography variant="h6">Summarize</Typography>
        <Typography component="div">
        When <em>enabled</em>, these entries will be auto-summarized, which makes browsing old entries a breeze. A scenario you'd likely disable this is <strong>Songs</strong> or <strong>Poetry</strong>.
        </Typography>
        <Button
          sx={{my: 2}}
          onClick={toggleMore}
          variant="outlined"
        >
          {showMore ? "Hide examples" : "Show example use-cases"}
        </Button>
          {showMore && <Box>
            Here's how Gnothi's creator uses tags:<ul>
            <li><b>Main</b>: My default. Most things go here.</li>
            <li><b>Dreams</b>: I record my dreams, as I'll be building some cool dream-analysis tooling into Gnothi. I disable <b>Index</b> on this tag, since I don't want Gnothi matching-making me to books or groups based on my dreams - that would be weird. But I keep <b>Summarize</b> enabled because I'd like to quick-scan through old dreams.</li>
            <li><b>Songs</b>: When a song or poem resonates with me, I copy/paste it as an entry. I keep <b>Index</b> enabled because I feel the song represents me in some way; I'd like AI to try to get at my core with that information. But I disable <b>Summarize</b> because - well how would you summarize a poem or song? It just gives weird output.</li>
            <li><b>Therapy</b>: I share this tag (see sidebar {'>'} Sharing) with my therapist. Before each session she can either read my entries, or run some AI reports (summarization, question-answering) for a quick update. That way we hit the ground running in our session. This is an example of the value of multiple tags per entry; I'll tag most things Main, and I'll <em>also</em> tag an entry Therapy if it's something I'm comfortable with my therapist reading.</li>
          </ul>
          </Box>}
      </CardContent>
    </Card>
  }

  function reorder(tags: Tags.tags_list_response[]) {
    const data = _.map(tags, ({id}, sort) => ({id, sort}))
    send('tags_reorder_request', data)

  }
  const renderTag = (tag: Tags.tags_list_response) => (
    <Form tag={tag} />
  )

  return (
    <FullScreenDialog
      open={true}
      onClose={close}
      title="Tags"
    >
      <DialogContent>
        <Grid justifyContent='space-between' container spacing={3}>
          <Grid item sm={12} md={7}>
            <Sortable items={tags} render={renderTag} onReorder={reorder} />
            <Create />
          </Grid>
          <Grid item sm={12} md={5}>
            {renderHelp()}
          </Grid>
        </Grid>
      </DialogContent>
    </FullScreenDialog>
  )
}
