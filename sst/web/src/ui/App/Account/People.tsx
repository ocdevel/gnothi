import React, {useEffect, useState} from "react"

import {useStore} from "@gnothi/web/src/data/store"
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";
 import DialogActions from "@mui/material/DialogActions"
 import DialogContent from "@mui/material/DialogContent"
 import Button from "@mui/material/Button"
 import Table from "@mui/material/Table"
 import TableHead from "@mui/material/TableHead"
 import TableRow from "@mui/material/TableRow"
 import TableBody from "@mui/material/TableBody"
 import TableCell from "@mui/material/TableCell"
 import TextField from "@mui/material/TextField"
 import Box from "@mui/material/Box"

function Person({close, person=null}) {
  const send = useStore(s => s.send)
  const as = useStore(state => state.as)

  const default_form = {name: '', relation: '', issues: '', bio: ''}
  const [form, setForm] = useState(person ? person : default_form)

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }

  const submit = async (e) => {
    e.preventDefault()
    if (person) {
      send('users_people_put_request', {...form, id: person.id})
    } else {
      send('users_people_post_request', form)
    }
    close()
  }

  const destroy = async () => {
    if (!person) {return}
    if (window.confirm("Delete person, are you sure?")) {
      send('users_people_delete_request',  {id: person.id})
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
  const as = useStore(state => state.as)
  const send = useStore(s => s.send)
  const people = useStore(s => s.users_people_list_response)
  const [person, setPerson] = useState(null)

  if (!people?.ids) {return null}

  const {ids, hash} = people

  useEffect(() => {
    fetchPeople()
  }, [])

  function fetchPeople() {
    send('users_people_list_request', {})
    setPerson(null)
  }

  const choosePerson = p => setPerson(p)

  const onClose = () => {
    setPerson(null)
    fetchPeople()
  }

  function renderRow(pid: string) {
    const p = hash[pid]
    return <TableRow
      className='cursor-pointer'
      onClick={() => choosePerson(p)}
      key={pid}
    >
      <TableCell>{p.name}</TableCell>
      <TableCell>{p.relation}</TableCell>
      {/*<td>{p.issues}</td>*/}
      <TableCell>{p.bio}</TableCell>
    </TableRow>
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
      {ids?.map(renderRow)}
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
