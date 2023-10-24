import React, {useEffect, useState} from "react";

import {useStore} from "@gnothi/web/src/data/store"
import {BasicDialog} from "../../../Components/Dialog.tsx";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import * as S from '@gnothi/schemas'
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {TextField2} from "../../../Components/Form.tsx";

interface DisconnectModal {
  show: boolean
  close: () => void
}
function DisconnectModal({show, close}: DisconnectModal) {
const send = useStore(s => s.send)

  function disconnect() {
    send('habitica_delete_request', {})
    close()
  }
  return (
    <BasicDialog open={show} onClose={close} title='Disconnect Habitica'>
      <DialogContent>
        <Typography>Are you sure you want to disconnect from Habitica? Your field history will be wiped from Gnothi, and you'd
          need to start collecting from scratch again if you change your mind in the future.</Typography>
        <Typography>Consider instead <strong>removing</strong> Habitica tasks which aren't relevant to AI (remove, not delete).
          Click a field name, and click "Remove". Details in that modal.</Typography>
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={close}>Cancel</Button>
        <Button color="secondary" size='small' onClick={disconnect}>Disconnect</Button>
      </DialogActions>
    </BasicDialog>
  )
}


export default function Habitica() {
  const send = useStore(s => s.send)
  const user = useStore(s => s.user?.me)

  const [showModal, setShowModal] = useState(false)
  const form = useForm({
    resolver: zodResolver(S.Fields.habitica_post_request),
    defaultValues: {
      habitica_user_id: user?.habitica_user_id,
      habitica_api_token: user?.habitica_api_token
    }
  })

  useEffect(() => {
    form.reset({
      habitica_user_id: user?.habitica_user_id || undefined,
      habitica_api_token: user?.habitica_api_token || undefined
    })
  }, [`${user?.habitica_user_id}-${user?.habitica_api_token}`])

  function submit(form: S.Fields.habtica_post_request){
    send('habitica_post_request', form)
  }

  return <>
    <DisconnectModal show={showModal} close={() => setShowModal(false)} />
    <form onSubmit={form.handleSubmit(submit)}>
      <Box display='flex' gap={2} flexDirection='column'>
        <TextField2
          name={'habitica_user_id'}
          form={form}
          label='User ID'
        />
        <TextField2
          label='API Key'
          name='habitica_api_token'
          form={form}
        />

        <Button type='submit' color='primary' variant="contained" size='small'>Save</Button>{' '}
        {user?.habitica_user_id && <Button
          size='small'
          color="secondary"
          onClick={() => setShowModal(true)}
        >Disconnect</Button>}
      </Box>
    </form>
  </>
}
