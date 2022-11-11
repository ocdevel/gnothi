import React, {useEffect, useState} from "react";
import {Spinner} from './utils'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {useStore} from "@gnothi/web/src/data/store"

export default function Ask() {
  const res = useStore(s => s.res.insights_question_response?.res)
  const job = useStore(s => s.res.insights_question_response?.row)
  const form = useStore(s => s.insights.question)
  const reply = useStore(s => s.res.insights_question_final?.row)
  const setInsight = useStore(a => a.setInsight)
  const postInsight = useStore(a => a.postInsight)
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
    postInsight('question')
  }

  const changeQuestion = e => setInsight(['question', e.target.value])

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
