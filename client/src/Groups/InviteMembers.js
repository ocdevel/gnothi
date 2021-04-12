import {useStoreActions, useStoreState} from "easy-peasy";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import * as yup from "yup";
import React, {useEffect} from "react";
import {Alert, Button, Form, Modal} from "react-bootstrap";
import Error from "../Error";

export default function InviteMembers({gid, close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const clear = useStoreActions(a => a.ws.clear)
  const invite = useStoreState(s => s.ws.data['groups/group/invite'])

  const form = useForm({
    resolver: yupResolver(yup.object().shape({
      email: yup.string().email().required()
    })),
  })

  useEffect(() => {
    return function() {
      clear(['groups/group/invite'])
    }
  }, [])

  useEffect(() => {
    if (invite?.valid) {
      form.setValue('email', null)
    }
  }, [invite])

  function submit(data) {
    emit(['groups/group/invite', {...data, id: gid}])
  }

  console.log(invite)

  const valid = invite?.valid ?? null

  return <>
    <Modal
      show={true}
      size='xl'
      onHide={close}
      scrollable={true}
      keyboard={false}
      backdrop='static'
    >
      <Modal.Header closeButton>
        <Modal.Title>Invite Members</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group controlId="form_email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="text"
              {...form.register("email")}
              isInvalid={valid === false}
              placeholder="Email of user"
            />
            <Form.Text className='text-muted'>Invite-by-email required to ensure you know the member you're inviting. Make sure they're already registered, this won't send an email invite.</Form.Text>
            {valid && <Alert variant='success'>Invite sent!</Alert>}
            {(valid === false) && <Form.Control.Feedback type='invalid'>That user doesn't exist, have them sign up first.</Form.Control.Feedback>}
          </Form.Group>
        </Form>
        <Error action={/groups\/group\/invite/g} codes={[400,401,403,422]}/>
      </Modal.Body>

      <Modal.Footer>
        <Button size='sm' variant='link' className='text-secondary mr-2' onClick={close}>
          Cancel
        </Button>
        <Button variant='primary' onClick={form.handleSubmit(submit)}>Invite</Button>
      </Modal.Footer>
    </Modal>
  </>
}
