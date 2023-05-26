import React, {useEffect, useState} from "react";
import {FaQuestionCircle} from "react-icons/fa";

import {useStore} from "@gnothi/web/src/data/store"
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Badge from "@mui/material/Badge";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CommentIcon from '@mui/icons-material/Comment';
import Tabs from "@gnothi/web/src/ui/Components/Tabs"
import {Checkbox2, TextField2} from "../../../Components/Form";
import {EntriesMessages} from "../../Chat/Messages";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Notes} from '@gnothi/schemas'
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";


type NoteType = {
  key: "label" | "note" | "resource"
  name: string
  user: string[]
  therapist: string[]
}
const noteTypes: NoteType[] = [{
  key: 'label',
  name: "Label",
  user: [
    "Labels help AI recommend resources to you.",
    "CBT & Zen promote labeling your thoughts as an objective observer, called thought diffusion. It helps you analyze your emotions, which has a positive cognitive impact.",
    "If you are sharing entries with a therapist, labels might be helpful for them as well."
  ],
  therapist: [
    "Labels can serve as mini note-taking tools for entries.",
  ]
}, {
  key: 'note',
  name: "Note",
  user: [
    "Notes also  help AI recommend resources to you.",
    "CBT & Zen promote labeling your thoughts as an objective observer, called thought diffusion. It helps you analyze your emotions, which has a positive cognitive impact.",
    "If you are sharing entries with a therapist, notes might be helpful for them as well."
  ],
  therapist: [
    "Private notes can be used by a therapist as an organized note-taking feature for clients. Private notes will also appear in the sidebar, so you can recall your notes before sessions.",
    "Non-private notes are viewable by both the sharer and the therapist/friend, and can serve as a communication tool for advice, support, etc.",
  ]
}, {
  key: 'resource',
  name: "Resource",
  user: [
    "This can be used for books, web articles, or anything else that you find relevant and helpful.",
    "Resources pinned to entries will also train AI to recommend similar resources in the future."
  ],
  therapist: [
    "This is a great way to recommend books, web articles, etc to friends or clients.",
    "Resources you've found relevant and helpful will train also AI to recommend such resources in the future.",
  ]
}]

type As_A = "user" | "therapist"

interface Create {
  entry_id: string
}
export default function Create({entry_id}: Create) {
  const as = useStore(state => state.user.as)
  const send = useStore(s => s.send)
  const user_id = useStore(s => s.user.me!.id)

  const [adding, setAdding] = useState<NoteType['key'] | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [qmarkHover, setQmarkHover] = useState(false)

  const form = useForm({
    resolver: zodResolver(Notes.entries_notes_post_request),
    defaultValues: Notes.entries_notes_post_request.parse({
      user_id, // this will be set manually to the submitter's user_id on the server regardless, for security
      entry_id,
      text: ""
    })
  })

  const tabs = [
    {value: 'user', label: 'As Journal Owner', render: () => renderTab('user')},
    {value: 'therapist', label: 'As Therapist/Friend', render: () => renderTab('therapist')},
  ]

  function close() {setShowHelp(false)}

  function renderTab(k: As_A) {
    return <Grid container spacing={2}>
      {k === 'therapist' && <Grid item xs={12}>
        <Alert severity="info">The sharing feature is coming back soon.</Alert>
      </Grid>}
      {noteTypes.map(obj => <React.Fragment key={k}>
        <Grid item xs>
          <Typography variant='button'>{obj.name}s</Typography>
          <List fullWidth>
            {obj[k].map((txt, i) => <React.Fragment key={k + i}>
              <ListItem>
                <ListItemText
                  primary={txt}
                />
              </ListItem>
              {/*{i < obj[k].length - 1 && <Divider component="li" />}*/}
            </React.Fragment>)}
          </List>
        </Grid>
      </React.Fragment>)}
    </Grid>
  }

  const renderHelpModal = () => {
    return <>
      <BasicDialog
        open={true}
        size='lg'
        onClose={close}
        title="Why label entries?"
      >
        <DialogContent>
          <Tabs
            tabs={tabs}
            defaultTab={as ? "therapist" : "user"}
          />
        </DialogContent>
      </BasicDialog>
    </>
  }

  const renderSection = (obj: NoteType) => {
    return (
      <Button
        sx={{mr: 1}}
        variant='outlined'
        color='primary'
        size='small'
        className={`btn-add-${obj.key}`}
        onClick={() => setAdding(obj.key)}
      >+ {obj.name}</Button>
    )
  }

  const renderButtons = () => <>
    {noteTypes.map(renderSection)}
    <span
      className='btn-show-help'
      onClick={() => setShowHelp(true)}
      onMouseEnter={() => setQmarkHover(true)}
      onMouseLeave={() => setQmarkHover(false)}
    >
      <FaQuestionCircle />
    </span>
    {qmarkHover && <span className='text-muted'>What are these?</span>}
  </>

  const clear = () => {
    form.reset()
    setAdding(null)
  }

  function submit(data: Notes.entries_notes_post_request) {
    send('entries_notes_post_request', {...data, type: adding})
    clear()
  }

  const renderForm = () => {
    const opts = {
      label: {
        helperText: "A word or three to describe what's going on here (codependence, rejection sensitivity dysphoria, trauma, etc)."
      },
      note: {
        multiline: true,
        minRows: 5,
        helperText: "Can be a note-to-self, a communication with the user, or a description of what's going on in this entry."
      },
      resource: {
        helperText: "Enter URL to a resource (a web article, Amazon book link, etc)."
      }
    }[adding]

    const handleSubmit = form.handleSubmit(submit)
    return <Box>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <TextField2
            name='text'
            label={`Add ${adding} here`}
            form={form}
            {...opts}
          />
          <Checkbox2
            name='private'
            label='Private'
            form={form}
            helperText={`This ${adding} will be visible only to you.`}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={clear}>
          Cancel
        </Button>
        <Button
          className='btn-submit'
          variant='contained'
          color="primary"
          onClick={handleSubmit}
        >Submit</Button>
      </DialogActions>
    </Box>
  }

  return <div className="create">
    {showHelp && renderHelpModal()}
    {adding ? renderForm() : renderButtons()}
  </div>
}

