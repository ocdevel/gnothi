import React, {useEffect, useState} from "react"
import {Col, Form} from "react-bootstrap"

import {useStoreActions, useStoreState} from "easy-peasy";
import {BasicDialog} from "../Helpers/Dialog";
import {
  DialogActions,
  DialogContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell, TextField, Box
} from "@material-ui/core";

function Person({close, person=null}) {
  const emit = useStoreActions(a => a.ws.emit)
  const as = useStoreState(state => state.user.as)

  const default_form = {name: '', relation: '', issues: '', bio: ''}
  const [form, setForm] = useState(person ? person : default_form)

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }

  const submit = async (e) => {
    e.preventDefault()
    if (person) {
      emit(['users/person/put', {...form, id: person.id}])
    } else {
      emit(['users/people/post', form])
    }
    close()
  }

  const destroy = async () => {
    if (!person) {return}
    if (window.confirm("Delete person, are you sure?")) {
      emit(['users/person/delete',  {id: person.id}])
    }
    close()
  }

  const textField = ({k, v, attrs, children}) => (
    <div>
      <TextField
        sx={{my: 2}}
        fullWidth
        label={v}
        readOnly={!!as}
        size='small'
        value={form[k]}
        onChange={changeForm(k)}
        {...attrs}
      />
    </div>
  )

  const req = {attrs: {required: true}}

  return <>
    <BasicDialog
      open={true}
      onClose={close}
      title={person ? "Edit Person" : "New Person"}
    >
      <DialogContent>
        <Box sx={{minWidth: 300}}>
          {textField({k: 'name', v: 'Name', ...req})}
          {textField({k: 'relation', v: 'Relation', ...req})}
          {/*textField({k: 'issues', v: 'Issues'})*/}
          {textField({k: 'bio', v: 'Bio', attrs: {multiline: true, minRows: 6}})}
        </Box>
      </DialogContent>
      <DialogActions>
        {person && <Button
          sx={{marginRight: 'auto'}}
          size='small'
          color='secondary'
          onClick={destroy}
        >Delete</Button>}
        <Button
          onClick={submit}
          variant='contained'
          color='primary'
          type="submit"
        >
          {person ? "Save": "Add"}
        </Button>
      </DialogActions>
    </BasicDialog>
  </>
}

export default function People() {
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(a => a.ws.emit)
  const people = useStoreState(s => s.ws.data['users/people/get'])
  const [person, setPerson] = useState(null)

  useEffect(() => {
    fetchPeople()
  }, [])

  function fetchPeople() {
    emit(['users/people/get', {}])
    setPerson(null)
  }

  const choosePerson = p => setPerson(p)

  const onClose = () => {
    setPerson(null)
    fetchPeople()
  }

  return <>
    {person && <Person
      close={onClose}
      person={person === true ? null : person}
    />}
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Relation</TableCell>
          {/*<th>Issues</th>*/}
          <TableCell>Bio</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
      {people?.map(p => (
        <TableRow
          className='cursor-pointer'
          onClick={() => choosePerson(p)}
          key={p.id}
        >
          <TableCell>{p.name}</TableCell>
          <TableCell>{p.relation}</TableCell>
          {/*<td>{p.issues}</td>*/}
          <TableCell>{p.bio}</TableCell>
        </TableRow>
      ))}
      </TableBody>
    </Table>
    <Button
      color="primary"
      variant='contained'
      sx={{mb:2}}
      onClick={() => choosePerson(true)}
    >Add Person</Button>
  </>
}
