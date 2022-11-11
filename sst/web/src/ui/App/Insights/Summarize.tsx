import React, {useState, useEffect} from 'react'
import {sent2face} from "@gnothi/web/src/utils/utils"
import {Spinner} from "./utils"

import {useStore} from "@gnothi/web/src/data/store"
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function Summarize() {
  const res = useStore(s => s.res['insights_summarize_response']?.res)
  const job = useStore(s => s.res['insights_summarize_response'])
  const form = useStore(s => s.insights.summarize)
  const reply = useStore(s => s.res['insights_summarize_final']?.first)
  const a = useStore(a => a.insights)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (res) {setWaiting(true)}
  }, [res])
  useEffect(() => {
    if (reply) {setWaiting(false)}
  }, [reply])

  if (res?.code === 403) { return <h5>{res.detail}</h5> }

  function changeWords(e) {
    a.setInsight(['summarize', e.target.value])
  }

  function submit(e) {
    e.preventDefault();
    a.postInsight('summarize')
  }

  const renderForm = () => (
    <TextField
      label="# Words"
      placeholder="Summarize in how many words"
      type="number"
      min={5}
      value={form}
      onChange={changeWords}
      helperText="How many words to summarize this time-range into. Try 100 if you're in a hurry; 300 is a sweet-spot."
    />
  )

  function renderReply() {
    let reply_ = reply?.[0]
    if (!reply_) {return null}
    if (!reply_.summary) {
      reply_ = <>Nothing to summarize (try adjusting date range)</>
    } else {
      reply_ = <>{sent2face(reply_.sentiment)} {reply_.summary}</>
    }
    return <>
      <Divider />
      <Card>
        <CardContent>
          <Typography>{reply_}</Typography>
        </CardContent>
      </Card>
    </>
  }

  return <>
    <form onSubmit={submit}>
      <Grid container direction='column' spacing={2}>
        <Grid item>
          {renderForm()}
        </Grid>
        <Grid item>
          {waiting ? <Spinner job={job} /> : <>
            <Button
              type="submit"
              color="primary"
              variant='contained'
            >Submit</Button>
          </>}
        </Grid>
        <Grid item>
          {renderReply()}
        </Grid>
      </Grid>
    </form>
  </>
}
