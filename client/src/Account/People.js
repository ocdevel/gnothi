import React, {useEffect, useState} from "react"
import {Button, Col, Form, Modal, Table} from "react-bootstrap"

import {useStoreActions, useStoreState} from "easy-peasy";

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
    <Form.Group as={Col} controlId={k}>
      <Form.Label>{v}</Form.Label>
      <Form.Control
        readOnly={!!as}
        size='sm'
        type="text"
        value={form[k]}
        onChange={changeForm(k)}
        {...attrs}
      />
      {children}
    </Form.Group>
  )

  const req = {attrs: {required: true}}

  return <>
    <Modal size="lg" show={true} onHide={close}>
      <Modal.Header>
        <Modal.Title>{person ? "Edit Person" : "New Person"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className='mb-3'>
          <Form.Row>
            {textField({k: 'name', v: 'Name', ...req})}
            {textField({k: 'relation', v: 'Relation', ...req})}
            {/*textField({k: 'issues', v: 'Issues'})*/}
          </Form.Row>
          <Form.Row>
            {textField({k: 'bio', v: 'Bio', attrs: {as: 'textarea', rows: 6}})}
          </Form.Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={submit}
          variant={person ? "primary" : "success"}
          type="submit"
        >
          {person ? "Save": "Add"}
        </Button>&nbsp;
        {person && <>
          <Button size='sm' variant='secondary' onClick={close}>Cancel</Button>&nbsp;
          <Button size='sm' variant='danger' onClick={destroy}>Delete</Button>
        </>}
      </Modal.Footer>
    </Modal>
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
      <thead>
        <tr>
          <th>Name</th>
          <th>Relation</th>
          {/*<th>Issues</th>*/}
          <th>Bio</th>
        </tr>
      </thead>
      <tbody>
      {people?.map(p => (
        <tr
          className='cursor-pointer'
          onClick={() => choosePerson(p)}
          key={p.id}
        >
          <td>{p.name}</td>
          <td>{p.relation}</td>
          {/*<td>{p.issues}</td>*/}
          <td>{p.bio}</td>
        </tr>
      ))}
      </tbody>
    </Table>
    <Button
      variant="success"
      className='mb-3'
      onClick={() => choosePerson(true)}
    >Add Person</Button>
  </>
}
