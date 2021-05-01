import {
  Badge,
  Form,
  Modal,
  Tabs,
  Tab
} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import {FaQuestionCircle} from "react-icons/all";

import {useStoreActions, useStoreState} from "easy-peasy";
import {FaRegComments} from "react-icons/fa";
import {BasicDialog} from "../Helpers/Dialog";
import {DialogActions, DialogContent, Card, CardContent, Grid, Button} from "@material-ui/core";

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
      <Badge variant="primary">{n.type}</Badge>{' '}
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
  const [text, setText] = useState('')
  const [private_, setPrivate] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [qmarkHover, setQmarkHover] = useState(false)

  function close() {setShowHelp(false)}

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
            variant="pills"
            defaultActiveKey={as ? "therapist" : "user"}
          >
            {['user', 'therapist'].map(k => (
              <Tab
                key={k}
                eventKey={k}
                title={k === 'user' ? "As Journal Owner" : "As Therapist/Friend"}
              >
                <Grid container lg={3} xs={1} style={{marginTop: '1rem'}}>
                  {noteTypes.map(obj => <Grid item>
                    <h5>{obj.name}s</h5>
                    {obj[k].map((txt, i) => <div key={k + i}>
                      {txt}
                      {i === obj[k].length - 1 ? null : <hr/>}
                    </div>)}
                  </Grid>)}
                </Grid>
              </Tab>
            ))}
          </Tabs>
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
    setText('')
    setPrivate(false)
    setAdding(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    const body = {entry_id, type: adding, text, private: private_}
    emit(['entries/notes/post', body])
    clear()
  }

  const renderForm = () => {
    const textOpts = {
      label: {type: 'text'},
      note: {as: 'textarea', cols: 5},
      resource: {type: 'text'}
    }[adding]
    const help = {
      label: "A word or three to describe what's going on here (codependence, rejection sensitivity dysphoria, trauma, etc).",
      note: "Can be a note-to-self, a communication with the user, or a description of what's going on in this entry.",
      resource: "Enter URL to a resource (a web article, Amazon book link, etc)."
    }[adding]
    return <>
      <BasicDialog open={true} size='lg' onHide={clear} title={`Add a ${adding}`}>
        <DialogContent>
          <Form onSubmit={submit}>
            <Form.Group controlId="formText">
              <Form.Control
                {...textOpts}
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <Form.Text>{help}</Form.Text>
            </Form.Group>
            <Form.Group controlId="formPrivate">
              <Form.Check
                type="checkbox"
                label="Private"
                checked={private_}
                onChange={(e) => setPrivate(e.target.checked)}
              />
              <Form.Text>This {adding} will be visible only to you.</Form.Text>
            </Form.Group>
          </Form>
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

  if (!(notes?.length || notifs?.length)) {return null}

  return <div>
    <FaRegComments /> {notes?.length || 0}
    {notifs && <Badge className='ml-2' variant='success'>{notifs} new</Badge>}
  </div>
}

export function NotesList({entry_id}) {
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
        <Badge variant="primary">{n.type}</Badge>{' '}
        {n.private ? "[private] " : null}
        {n.text}
      </CardContent>
    </Card>)}
  </div>
}
