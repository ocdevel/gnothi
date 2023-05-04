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
import {makeForm, yup, Checkbox2, TextField2} from "@gnothi/web/src/ui/Components/Form";
import {EntriesMessages} from "../../Chat/Messages";

const schema = yup.object({
  // type: yup.string().required(),  // TODO this comes from `adding`, which is weird
  text: yup.string().min(1),
  private: yup.boolean()
});
const defaults = {
  // type: 'note',
  text: '',
  private: false
}
const useForm = makeForm(schema, defaults)

const noteTypes = [{
  key: 'label',
  name: "Label",
  user: [
    "CBT & Zen promote labeling your thoughts as an objective observer, called \"thought diffusion\". It gets you outside your emotions to analyze them, which has positive cognitive impact.",
    "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
    "Might help therapists assess your entries."
  ],
  therapist: [
    "Can serve as mini note-taking on entries.",
    "Helps AI recommend resources to this client."
  ]
}, {
  key: 'note',
  name: "Note",
  user: [
    "CBT & Zen promote labeling your thoughts as an objective observer, called \"thought diffusion\". It gets you outside your emotions to analyze them, which has positive cognitive impact. The more dispassionate details, the better the effect.",
    "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
    "Might help therapists assess your entries.",
  ],
  therapist: [
    "For private notes, consider this an organized note-taking feature for your clients. Private notes will also appear in the sidebar, so you can recall your notes before your session.",
    "Helps AI recommend resources. Also helps AI recommend resources to other users with similar entries.",
    "Non-private notes can serve as communication with the client: advice, support, or helping them understand their entries from your perspective.",
  ]
}, {
  key: 'resource',
  name: "Resource",
  user: [
    "Books, web articles, etc you've found relevant and helpful will train AI to recommend such resources to future users with similar entries."
  ],
  therapist: [
    "Recommend resources to this client.",
    "Books, web articles, etc you've found relevant and helpful will train AI to recommend such resources to future users with similar entries.",
  ]
}]

interface Create {
  entry_id: string
  onSubmit: (data: any) => void
}
export default function Create({entry_id, onSubmit}: Create) {
  const as = useStore(state => state.as)
  const send = useStore(s => s.send)

  const [adding, setAdding] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [qmarkHover, setQmarkHover] = useState(false)

  const form = useForm()

  const tabs = [
    {value: 'user', label: 'As Journal Owner', render: () => renderTab('user')},
    {value: 'therapist', label: 'As Therapist/Friend', render: () => renderTab('therapist')},
  ]

  function close() {setShowHelp(false)}

  function renderTab(k) {
    return <Grid container spacing={2}>
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

  const renderSection = (obj) => {
    return (
      <Button
        sx={{mr: 1}}
        variant='outlined'
        color='primary'
        size='small'
        onClick={() => setAdding(obj.key)}
      >+ {obj.name}</Button>
    )
  }

  const renderButtons = () => <>
    {noteTypes.map(renderSection)}
    <span
      className='cursor-pointer mr-2'
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

  function submit(data) {
    const body = {...data, entry_id, type: adding}
    send('entries_notes_post_request', body)
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
    return <>
      <BasicDialog open={true} size='lg' onClose={clear} title={`Add a ${adding}`}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(submit)}>
            <TextField2
              name='text'
              label="Entry"
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
          <Button size="small" variant={false} onClick={clear}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color="primary"
            onClick={submit}
          >Submit</Button>
        </DialogActions>
      </BasicDialog>
    </>
  }

  return <>
    {showHelp && renderHelpModal()}
    {adding ? renderForm() : renderButtons()}
  </>
}

