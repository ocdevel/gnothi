import React, {useEffect, useState} from "react";
import {FaQuestionCircle} from "react-icons/fa";

import {useStoreActions, useStoreState} from "easy-peasy";
import {BasicDialog} from "../Helpers/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Badge from "@material-ui/core/Badge";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import CommentIcon from '@material-ui/icons/Comment';
import Tabs from '../Helpers/Tabs'
import {makeForm, yup, Checkbox2, TextField2} from "../Helpers/Form";
import {EntriesMessages} from "../Chat/Messages";
import {Entry} from "./Entry";

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

export function NotesAll() {
  return null
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(a => a.ws.emit)
  const notes = useStoreState(s => s.ws.data['entries/notes/get'])

  useEffect(() => {
    emit(['entries/notes/get', {}])
  }, [as])

  if (!notes.length) {return null}
  return <>
    <h5>Notes</h5>
    {notes.map(n => <>
      <Chip variant="primary" label={n.type} />
      {n.private ? "[private] " : null}
      {n.text}
      <hr/>
    </>)}
  </>
}

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

export function AddNotes({entry_id, onSubmit}) {
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(a => a.ws.emit)

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
    emit(['entries/notes/post', body])
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

export function NotesNotifs({entry_id}) {
  const notes = useStoreState(s => s.ws.data['entries/notes/get']?.[entry_id])
  const notifs = useStoreState(s => s.ws.data['notifs/notes/get']?.[entry_id])

  const nNotes = notes?.length || 0
  const nNotifs = notifs?.length || 0
  if (!(nNotes || nNotifs)) {return null}

  return <>
    <Button
      color={nNotifs ? "primary" : "inherit"}
      startIcon={<Badge badgeContent={nNotifs} color="primary">
        <CommentIcon />
      </Badge>}
    >
      {nNotes}
    </Button>
  </>
}

export const NotesList = EntriesMessages

export function NotesListOld({entry_id}) {
  const emit = useStoreActions(a => a.ws.emit)
  const notes = useStoreState(s => s.ws.data['entries/notes/get']?.[entry_id])

  useEffect(() => {
    emit(['entries/notes/get', {entry_id}])
  }, [entry_id])

  if (!notes?.length) {return null}

  return <div style={{marginTop: '1rem'}}>
    <NotesNotifs entry_id={entry_id} />
    {notes.map(n => <Card className='mb-3' key={n.id}>
      <CardContent>
        <Chip variant="outlined" label={n.type} />{' '}
        {n.private ? "[private] " : null}
        {n.text}
      </CardContent>
    </Card>)}
  </div>
}
