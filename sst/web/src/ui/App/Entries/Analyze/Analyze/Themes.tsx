import React, {useEffect, useState} from "react"
import {sent2face} from "@gnothi/web/src/utils/utils"
import {Spinner} from "./utils"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import {useStore} from "@gnothi/web/src/data/store"
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default function Themes() {
  const [advanced, setAdvanced] = useState(false)
  const send = useStore(s => s.send)
  const days = useStore(s => s.analyze.days)
  const res = useStore(s => s.res['analyze_themes_response']?.res)
  const job = useStore(s => s.res['analyze_themes_response'])
  const form = useStore(s => s.analyze.themes)
  const reply = useStore(s => s.res['analyze_themes_final'])
  const a = useStore(a => a.analyze)
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
    a.postInsight('themes')
  }

  const renderTerms = terms => {
    if (!terms) {return null}
    return terms.map((t, i) => <>
      <code>{t}</code>
      {i < terms.length - 1 ? ' · ' : ''}
    </>)
  }

  const renderThemes = () => {
    const themes_ =_.sortBy(reply.themes, 'n_entries').slice().reverse()
    if (!themes_.length) {
      return <p>No patterns found in your entries yet, come back later</p>
    }
    return <>
      <div>
        <h5>Top terms</h5>
        <p>{renderTerms(reply.terms)}</p>
        <hr/>
      </div>
      {themes_.map((t, i) => (
        <div key={`${i}-${t.length}`} className='mb-3'>
          <h5>{sent2face(t.sentiment)} {t.n_entries} Entries</h5>
          <p>
            {renderTerms(t.terms)}
            {t.summary && <p><b>Summary</b>: {t.summary}</p>}
          </p>
          <hr />
        </div>
      ))}
      <p>Does the output seem off? Try <BsGear /> Advanced.</p>
    </>
  }

  return <Grid container spacing={2} direction='column'>
    {waiting ? <Grid item>
      <Spinner job={job} />
    </Grid> : <>
      <Grid item>{renderAdvanced()}</Grid>
      <Grid item>
        <Button
          color='primary'
          variant="contained"
          onClick={submit}
        >Show Themes</Button>
      </Grid>
    </>}
    {reply && <Grid item>{renderThemes()}</Grid>}
  </Grid>
}
