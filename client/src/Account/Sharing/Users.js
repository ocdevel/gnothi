import * as yup from "yup";
import {useStoreActions, useStoreState} from "easy-peasy";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import React, {useEffect, useState} from "react";
import {Button, Col, Form, ListGroup, Row} from "react-bootstrap";
import {FaTrash} from "react-icons/fa";
import {EE} from '../../redux/ws'
import {trueKeys} from "../../Helpers/utils";
import Error from "../../Error";

const emailSchema = yup.object().shape({
  email: yup.string().email().required(),
})

export default function Users({users, setUsers}) {
  const emit = useStoreActions(a => a.ws.emit)
  const checked = useStoreState(s => s.ws.data['shares/email/check']?.email)
  const form = useForm({
    resolver: yupResolver(emailSchema),
  });

  useEffect(() => {
    const email = form.getValues('email')
    if (checked && checked === email) {
      setUsers({...users, [email]: true})
      form.reset({email: ""})
    }
  }, [checked])

  const removeUser = email => () => {
    setUsers({...users, [email]: false})
  }

  function submit(form) {
    emit(['shares/email/check', form])
  }

  function renderUsers() {
    const arr = trueKeys(users)
    if (!arr.length) {return null}
    return <ListGroup variant='flush'>
      {arr.map(a => <ListGroup.Item key={a}>
        <FaTrash className='cursor-pointer' onClick={removeUser(a)}/> {a}
      </ListGroup.Item>)}
    </ListGroup>
  }

  return <Form onSubmit={form.handleSubmit(submit)}>
    <Form.Group controlId={`share-email`}>
      <Form.Label>People</Form.Label>
      <Row>
        <Col sm={9}>
          <Form.Control
            type="email"
            size='sm'
            required
            placeholder="Email address"
            {...form.register('email')}
          />
        </Col>
        <Col sm={3}>
          <Button type='submit' size='sm'>Add</Button>
        </Col>
      </Row>
      <Form.Text className="text-muted">
        Email of person you'll share data with. If they're not on Gnothi, have them sign up first.
      </Form.Text>
      <Error action={/shares\/email\/check/g} codes={[400, 404]} />
      {renderUsers()}
    </Form.Group>
  </Form>
}
