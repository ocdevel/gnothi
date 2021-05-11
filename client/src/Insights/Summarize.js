import React, {useState, useEffect} from 'react'
import {sent2face} from "../Helpers/utils"
import {Spinner} from "./utils"

import {useStoreState, useStoreActions} from "easy-peasy";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

export default function Summarize() {
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)
  const res = useStoreState(s => s.ws.res['insights/summarize/post'])
  const job = useStoreState(s => s.ws.data['insights/summarize/post'])
  const form = useStoreState(s => s.insights.summarize)
  const reply = useStoreState(s => s.ws.data['insights/summarize/get'])
  const a = useStoreActions(a => a.insights)
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
              disabled={aiStatus !== 'on'}
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
