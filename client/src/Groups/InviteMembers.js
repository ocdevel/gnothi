import {useStoreActions, useStoreState} from "easy-peasy";
import React, {useEffect} from "react";
import Error from "../Error";
import {BasicDialog} from "../Helpers/Dialog";
import {Button, DialogActions, DialogContent, Alert, FormGroup} from "@material-ui/core";
import {yup, makeForm, TextField2} from "../Helpers/Form";

const schema = yup.object().shape({
  email: yup.string().email().required()
})
const useForm = makeForm(schema)

export default function InviteMembers({gid, close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const clear = useStoreActions(a => a.ws.clear)
  const invite = useStoreState(s => s.ws.data['groups/member/invite'])

  const form = useForm()

  useEffect(() => {
    return function() {
      clear(['groups/member/invite'])
    }
  }, [])

  useEffect(() => {
    if (invite?.valid) {
      form.setValue('email', null)
    } else if (invite?.valid === false) {
      const err = {
        type: 'manual',
        message: "That user doesn't exist, have them sign up first."
      }
      form.setError('email', err)
    }
  }, [invite])

  function submit(data) {
    emit(['groups/member/invite', {...data, id: gid}])
  }

  console.log(invite)

  const valid = invite?.valid ?? null

  return <>
    <BasicDialog
      open={true}
      size='xl'
      onClose={close}
      title='Invite Members'
    >
      <DialogContent>
        <form onSubmit={form.handleSubmit(submit)}>
          <FormGroup>
            <TextField2
              label='Email'
              name='email'
              form={form}
              placeholder="Email of user"
              helperText="Invite-by-email required to ensure you know the member you're inviting. Make sure they're already registered, this won't send an email invite."
            />
            {valid && <Alert severity='success'>Invite sent!</Alert>}
          </FormGroup>
        </form>
        <Error action={/groups\/group\/invite/g} codes={[400,401,403,422]}/>
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={close}>
          Cancel
        </Button>
        <Button color="primary" variant='outlined' onClick={form.handleSubmit(submit)}>Invite</Button>
      </DialogActions>
    </BasicDialog>
  </>
}
