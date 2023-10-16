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
import {Tags} from '@gnothi/schemas/tags'
import Stack from "@mui/material/Stack";
import CardActions from "@mui/material/CardActions";

interface Modal {
  close: () => void
}

export default function Modal({close}: Modal) {
  const send = useStore(s => s.send)
  const tags = useStore(s => s.res.tags_list_response?.rows || [])
  const [showMore, setShowMore] = useState(false)

  function toggleMore() {
    setShowMore(!showMore)
  }

  function renderHelp() {
    return <Card
      sx={{
        display: 'inline-block',
        backgroundColor: '#ffffff',
        borderRadius: 3
      }}>
      <CardContent>
        <Box mb={3}>
          <Typography color="primary" variant="h4" mb={0} fontWeight={500}>
            Using Tags
          </Typography>
          <Typography color="primary" mb={2} variant={"body1"} fontWeight={500}>
            Streamline the organization of entries by topic</Typography>
          <Typography>
            Some apps do this via multiple journals, like folders on a computer. Gnothi uses tags instead, adding more
            flexibility for entry-sharing and AI.
          </Typography>
        </Box>

        <Box>
          <Typography marginRight={1} color="primary" variant="h4" mb={0} fontWeight={500}>About Index and
            Summarize</Typography>

          <Typography color="primary" mb={2} variant={"body1"} fontWeight={500}>
            Choose which tags do or don't use AI</Typography>
          <Typography>
            AI summarization condenses longer entries into short summaries, while indexing uses AI to provide
            personalized insights. </Typography>
        </Box>

        <CardActions sx={{justifyContent: "flex-end", mt: 3}}>
          <Button
            sx={{my: 2}}
            onClick={toggleMore}
            variant="outlined"
            color="secondary"
          >
            {showMore ? "Hide" : "Tag Settings and Pro Tips"}
          </Button>
        </CardActions>
        {showMore && <Box>
          <Box mb={2}>
            <Typography color="primary" variant="h4" mt={3} fontWeight={500}>Tag Setting Suggestions</Typography>
            <Typography color="primary" variant={"body1"} fontWeight={600}>Main:</Typography>
            <Typography mb={.5} variant="body1">This is our standard tag. The majority of entries fall under this
              category.</Typography>
            <Typography variant="body2"><u>Index</u>: Enabled, to help AI to understand you better.</Typography>
            <Typography variant="body2"><u>Summarize</u>: Enabled, to capture snapshots of your entries in
              aggregate.</Typography>
          </Box>
          <Box mb={2}>
            <Typography color="primary" variant={"body1"} fontWeight={600}>Dreams:</Typography>
            <Typography mb={.5} variant="body1">Ideal for logging dreams. Plus, we'll be launching a Dream Analysis
              feature very shortly!</Typography>
            <Typography variant="body2"><u>Index</u>: Disabled, to prevent dream-based suggestions.</Typography>
            <Typography variant="body2"><u>Summarize</u>: Enabled, for quick dream recollection.</Typography>
          </Box>
          <Box mb={2}>
            <Typography color="primary" variant={"body1"} fontWeight={600}>Songs:</Typography>
            <Typography mb={.5} variant="body1">Use this tag for songs or poems that resonate with you.</Typography>
            <Typography variant="body2"><u>Index</u>: Enabled, to help AI to understand you better.</Typography>
            <Typography variant="body2"><u>Summarize</u>: Disabled, to preserve the original essence of the
              content.</Typography>
          </Box>
          <Box mb={2}>
            <Typography color="primary" variant={"body1"} fontWeight={600}>Therapy:</Typography>
            <Typography mb={.5} variant="body1">You may decide to create this tag to share specific entries with your
              therapist.</Typography>
            <Typography variant="body2"><u>Index</u>: Enabled, get AI insights like recurring themes, books,
              etc.</Typography>
            <Typography variant="body2"><u>Summarize</u>: Enabled, to summarize your progress and
              experiences.</Typography>
          </Box>
          <Box mb={2}>
            <Typography color="primary" variant="h4" mt={3} fontWeight={500}>Pro Tips:</Typography>
            <Typography color="primary" variant={"body1"} fontWeight={600}>Multi-Tagging:</Typography>
            <Typography variant="body1">Assign multiple tags to an entry, when it makes sense, to capture it in
              different contexts.</Typography>
          </Box>
          <Box mb={2}>
            <Typography color="primary" variant={"body1"} fontWeight={600}>Consistency:</Typography>
            <Typography variant="body1">Stick to the same tags for similar entries to simplify searching and stay
              organized.</Typography>
          </Box>
          <Typography color="primary" variant={"body1"} fontWeight={600}>Balanced Tagging:</Typography>
          <Typography variant="body1">Opt for tags that are precise, yet inclusive enough to group related
            entries.</Typography>
        </Box>}
      </CardContent>
    </Card>
  }

  function reorder(tags: Tags.tags_list_response[]) {
    const data = _.map(tags, ({id}, sort) => ({id, sort}))
    send('tags_reorder_request', data)

  }

  const renderTag = (tag: Tags.tags_list_response) => (
    <Form tag={tag}/>
  )

  return (
    <FullScreenDialog
      open={true}
      onClose={close}
      title="Tags"
    >
      <DialogContent>
        <Grid container
              justifyItems="flex-start">
          <Grid justifyContent='space-between' container item spacing={3}>
            <Grid item sm={12} md={7}>
              {/*<Sortable items={tags} render={renderTag} onReorder={reorder}/>*/}
              <Create/>
            </Grid>
            <Grid item sm={12} md={5}>
              {renderHelp()}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </FullScreenDialog>
  )
}
