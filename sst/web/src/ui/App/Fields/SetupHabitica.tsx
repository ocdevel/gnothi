import React, {useEffect, useState} from "react";

import {useStore} from "@gnothi/web/src/data/store"
import {BasicDialog} from "@gnothi/web/src/ui/Components/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

function DisconnectModal({show, close}) {
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
  const user = useStore(s => s.user.me)

  const [habiticaUserId, setHabiticaUserId] = useState(user?.habitica_user_id)
  const [habiticaApiToken, setHabiticaApiToken] = useState(user?.habitica_api_token)
  const [showModal, setShowModal] = useState(false)

  const saveHabitica = async e => {
    e.preventDefault()
    const body = {
      habitica_user_id: habiticaUserId,
      habitica_api_token: habiticaApiToken
    }
    send('habitica/post', body)
  }

  const changeHabiticaUserId = e => setHabiticaUserId(e.target.value)
  const changeHabiticaApiToken = e => setHabiticaApiToken(e.target.value)

  return <>
    <DisconnectModal show={showModal} close={() => setShowModal(false)} />
    <form onSubmit={saveHabitica}>
      <Box display='flex' gap={2} flexDirection='column'>
        <TextField
          label='User ID'
          value={habiticaUserId}
          onChange={changeHabiticaUserId}
        />
        <TextField
          label='API Key'
          value={habiticaApiToken}
          onChange={changeHabiticaApiToken}
        />

        <Button type='submit' color='primary' variant="contained" size='small'>Save</Button>{' '}
        {habiticaUserId && <Button size='small' color="secondary" onClick={() => setShowModal(true)}>Disconnect</Button>}
      </Box>
    </form>
  </>
}
