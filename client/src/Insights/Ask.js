import React, {useEffect, useState} from "react";
import {Spinner} from './utils'
import {Button, Card, CardContent, Divider, Grid, TextField, Typography} from '@material-ui/core'

import {useStoreActions, useStoreState} from "easy-peasy";

export default function Ask() {
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)
  const res = useStoreState(s => s.ws.res['insights/question/post'])
  const job = useStoreState(s => s.ws.data['insights/question/post'])
  const form = useStoreState(s => s.insights.question)
  const reply = useStoreState(s => s.ws.data['insights/question/get'])
  const a = useStoreActions(a => a.insights)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (res) {setWaiting(true)}
  }, [res])
  useEffect(() => {
    if (reply) {setWaiting(false)}
  }, [reply])

  if (res?.code === 403) { return <h5>{res.detail}</h5> }

  function submit(e) {
    e.preventDefault()
    if (!form.length) {return}
    a.postInsight('question')
  }

  const changeQuestion = e => a.setInsight(['question', e.target.value])

  return <>
    <form onSubmit={submit}>
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <TextField
            label="Question"
            placeholder="How do I feel about x?"
            multiline
            minRows={3}
            value={form}
            onChange={changeQuestion}
            helperText="Use proper English & grammar. Use personal pronouns."
          />
        </Grid>
        <Grid item>
          {waiting ? <Spinner job={job} /> : <>
            <Button
              disabled={aiStatus !== 'on'}
              color="primary"
              variant="contained"
              type="submit"
            >Ask</Button>
          </>}
        </Grid>
      </Grid>
    </form>
    {reply?.length && <>
      <Divider sx={{my: 2}}/>
      {reply.map((a, i) => <>
        <Card sx={{my: 2}}>
          <CardContent>
            <Typography>{a.answer}</Typography>
          </CardContent>
        </Card>
      </>)}
    </>}
  </>
}
