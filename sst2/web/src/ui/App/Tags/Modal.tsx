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
import Create from "./Create";
import Form from './Form'

interface Modal {
  close: () => void
}
export default function Modal({close}: Modal) {
  const send = useStore(s => s.send)
  const tags = useStore(s => s.res.tags_list_response?.rows || [])
  const [showMore, setShowMore] = useState(false)

  function toggleMore() {setShowMore(!showMore)}
  function renderToggle() {
    return <Box sx={{display:'flex', alignItems: 'center'}}>
      <Box sx={{pr: 2}}>About</Box>
      <FormControlLabel
        control={<Switch checked={true} name="ai" color='primary'/>}
        label={<FaRobot />}
      />
    </Box>
  }

  function renderHelp() {
    return <Card>
      <CardHeader title='About Tags' />
      <CardContent>
        <Typography variant='body1'>
          <div>Tags organize your journal entries by topic (eg personal, work, dreams). Some apps do this via <em>multiple journals</em>, like folders on a computer. Gnothi uses tags instead, adding more flexibility for entry-sharing & AI.</div>
          <Button size='small' onClick={toggleMore}>{showMore ? "Hide examples" : "Show examples / ideas"}</Button>
          {showMore && <div>
            Here's how Gnothi's creator uses tags:<ul>
            <li><b>Main</b>: My default. Most things go here.</li>
            <li><b>Dreams</b>: I record my dreams, as I'll be building some cool dream-analysis tooling into Gnothi. I disable <FaRobot /> on this tag, since I don't want Gnothi matching-making me to books / groups based on my dreams - that would be weird.</li>
            <li><b>Therapy</b>: I share this tag (see sidebar {'>'} Sharing) with my therapist. Before each session she can either read my entries, or run some AI reports (summarization, question-answering) for a quick update. That way we hit the ground running in our session. This is an example of the value of multiple tags per entry; I'll tag most things Main, and I'll <em>also</em> tag an entry Therapy if it's something I'm comfortable with my therapist reading.</li>
          </ul>
          </div>}
        </Typography>
      </CardContent>
      <CardHeader title={renderToggle()} />
      <CardContent>
        <Typography variant='body1'>
          By default, Gnothi will use all of your tags to decide which entries "represent you". Those entries are then used for match-making you with books, groups, therapists, etc. There will likely be tags you don't want used; the obvious example is Dreams. If you dream-journal, create a tag called "Dreams" and un-check its <FaRobot />. That way you won't get super weird book / group recommendations.
        </Typography>
      </CardContent>
    </Card>
  }

  function reorder(tags) {
    const data = _.map(tags, ({id}, sort) => ({id, sort}))
    send('tags_reorder_request', data)

  }
  const renderTag = (tag) => <Form tag={tag} />

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
