import React, {useState} from "react";
import {Button, Form, Table} from "react-bootstrap";

export default function Family({fetch_}) {
  const [form, setForm] = useState({})
  const [family, setFamily] = useState([
    {name: 'Tyler', type: 'Self', issues: ['Depression']},
    {name: 'Susan', type: 'Mother'},
    {name: 'Robert', type: 'Father'},
  ])

  const addFamily = e => {
    e.preventDefault();
    family.push(form)
    setFamily(family)
    setForm({name: '', type: 'Self'})
  }

  const changeForm = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setForm({...form, [k]: v})
  }


  return <div>
    <h1>Family</h1>
    <Form onSubmit={addFamily}>
      <Form.Group controlId="formFamilyName">
        <Form.Label>Family Member Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Susan"
          value={form.name}
          onChange={changeForm('name')}
        />
      </Form.Group>

      <Form.Group controlId="formFamilyType">
        <Form.Label>Family Role</Form.Label>
        <Form.Control
          as="select"
          onChange={changeForm('type')}
          value={form.type}
        >
          <option>Self</option>
          <option>Partner</option>
          <option>Mother</option>
          <option>Father</option>
          <option>Brother</option>
          <option>Sister</option>
          <option>Grandmother</option>
          <option>Grandfather</option>
          <option>Great Grandfather</option>
          <option>Great Grandmother</option>
          <option>Aunt</option>
          <option>Uncle</option>
          <option>Child</option>
          <option>Grandchild</option>
        </Form.Control>
      </Form.Group>

      <Button variant="success" type="submit">Add</Button>
    </Form>

    <Table>
      <thead>
        <th>Name</th>
        <th>Type</th>
        <th>Issues</th>
      </thead>
      <tbody>
      {family.map(f => <tr>
        <td>{f.name}</td>
        <td>{f.type}</td>
        <td>
          <Form.Group controlId="exampleForm.ControlSelect2">
            <Form.Control
              as="select"
              multiple
              value={f.issues}
              onChange={changeForm('issues')}
            >
              <option>Depression</option>
              <option>Alcoholism</option>
              <option>Avoidant attachment</option>
              <option>Anxious attachment</option>
              <option>Abuse</option>
              <option>Bipolar</option>
              <option>Deceased</option>
              <option>Abandonment</option>
            </Form.Control>
          </Form.Group>
        </td>
      </tr>)}
      </tbody>
    </Table>
  </div>
}
