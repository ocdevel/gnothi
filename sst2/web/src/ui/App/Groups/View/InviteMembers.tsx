import {useStore} from "../../../../data/store"
import React, {useEffect} from "react";
import Error from "../../../Components/Error";
import {BasicDialog} from "../../../Components/Dialog";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Alert from "@mui/material/Alert";
import FormGroup from "@mui/material/FormGroup";
import {yup, makeForm, TextField2} from "../../../Components/Form";

const schema = yup.object().shape({
  email: yup.string().email().required()
})
const useForm = makeForm(schema)

export default function InviteMembers({gid, close}) {
const send = useStore(s => s.send)
  const clear = useStore(a => a.clear)
  const invite = useStore(s => s.res.groups_members_invite_response)

  const form = useForm()

  useEffect(() => {
    return function() {
      clear(['groups_members_invite_response'])
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
    send('groups_members_invite_request', {...data, id: gid})
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
        <Error event={/groups\/group\/invite/g} codes={[400,401,403,422]}/>
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
