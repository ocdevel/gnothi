import React, {useState} from "react";
import axios from "axios";
import fileDownload from "js-file-download";
import Button, {ButtonProps} from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import {useStore} from '../../../../data/store'
import {Auth} from "aws-amplify";

interface Advanced {
  fetchFieldEntries: Function
}
export default function Advanced({fetchFieldEntries}: Advanced) {
  const send = useStore(s => s.send)
  const authenticated = useStore(s => s.authenticated)
  const addError = useStore(s => s.addError)
  const [confirmWipe, setConfirmWipe] = useState('')

  async function downloadCsv(version: string) {
    return alert("Download csv not implemented")
    const jwt = (await Auth.getSession()).getIdToken().getJwtToken()
    // TODO refactor this into actions.js/fetch_
    const obj = {
      method: 'get',
      url: `${API_URL}/field-entries/csv/${version}`,
      headers: {'Authorization' : `Bearer ${jwt}`},
      responseType: 'blob',
    }

    try {
      const {data} = await axios(obj)
      const fname = {'new': 'field_entries', 'old': 'field_entries_old'}[version]
      fileDownload(data, `${fname}.csv`);
    } catch (error) {
      let {statusText: message, data} = error.response
      message = data.detail || message || "There was an error"
      addError(<Typography>{message}</Typography>)
    }
  }

  async function startOver() {
    send('fields_entries_clear_request', {})
  }

  function changeConfirmWipe(e) {
    setConfirmWipe(e.target.value)
  }

  const btnOpts: ButtonProps = {size: 'small', color: "primary", variant: 'outlined', fullWidth: true}

  return <div>
    <Button
      {...btnOpts}
      onClick={() => downloadCsv('new')}
    >Download field_entries.csv</Button>
    <Typography variant='caption'>Export your field-entries to CSV</Typography>
    <Button
      {...btnOpts}
      disabled={confirmWipe !== 'wipe field entries'}
      variant='outlined'
      color='secondary'
      onClick={startOver}
      sx={{mb: 2}}
    >Start Over</Button>
    <TextField
      size='small'
      placeholder="wipe field entries"
      value={confirmWipe}
      onChange={changeConfirmWipe}
      helperText={<>Wipe field entries for all days and start from scratch (keeping the fields, just clearing their entries). Enable the button by typing in the text-field "wipe field entries". <a href="https://github.com/lefnire/gnothi/issues/114" target="_blank">Why do this?</a></>}
    />
  </div>
}
