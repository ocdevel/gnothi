import React, {useEffect, useState} from "react";
import {Button, Col, Form, Table} from "react-bootstrap";

function Person({fetch_, as, onSubmit=null, person=null}) {
  const default_form = {name: '', relation: '', issues: '', bio: ''}
  const [form, setForm] = useState(person ? person : default_form)

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }

  const submit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (person) {
      await fetch_(`people/${person.id}`, 'PUT', form)
    } else {
      await fetch_('people', 'POST', form)
    }
    onSubmit()
  }

  const destroy = async () => {
    if (!person) {return}
    if (window.confirm("Delete person, are you sure?")) {
      await fetch_(`people/${person.id}`, 'DELETE')
    }
    onSubmit()
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
    <Form onSubmit={submit} className='bottom-margin'>
      <Form.Row>
        {textField({k: 'name', v: 'Name', ...req})}
        {textField({k: 'relation', v: 'Relation', ...req})}
        {/*textField({k: 'issues', v: 'Issues'})*/}
      </Form.Row>
      <Form.Row>
        {textField({k: 'bio', v: 'Bio', attrs: {as: 'textarea', cols: 3}})}
      </Form.Row>
      <Button
        variant={person ? "primary" : "success"}
        type="submit"
      >
        {person ? "Save": "Add"}
      </Button>&nbsp;
      {person && <>
        <Button size='sm' variant='secondary' onClick={onSubmit}>Cancel</Button>&nbsp;
        <Button size='sm' variant='danger' onClick={destroy}>Delete</Button>
      </>}
    </Form>
  </>
}

export default function People({fetch_, as}) {
  const [people, setPeople] = useState([])
  const [person, setPerson] = useState(null)

  const fetchPeople = async () => {
    const {data} = await fetch_('people')
    setPerson(null)
    setPeople(data)
  }

  useEffect(() => {fetchPeople()}, [])

  const choosePerson = p => setPerson(p)

  const onSubmit = () => {
    setPerson(null)
    fetchPeople()
  }

  return <>
    <Person
      key={person ? person.id : +new Date}
      fetch_={fetch_}
      as={as}
      onSubmit={onSubmit}
      person={person}
    />
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Relation</th>
          {/*<th>Issues</th>*/}
          <th>Bio</th>
        </tr>
      </thead>
      {people.map(p => (
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
      <tbody>

      </tbody>
    </Table>
  </>
}
