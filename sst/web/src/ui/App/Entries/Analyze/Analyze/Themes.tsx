import React, {useEffect, useState} from "react"
import {sent2face} from "@gnothi/web/src/utils/utils"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import {useStore} from "@gnothi/web/src/data/store"
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import {analyze_themes_response} from '@gnothi/schemas/analyze'
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import {LinearProgress} from "@mui/material";

export default function Themes() {
  const submitted = useStore(s => !!s.res.analyze_get_response?.first)
  const themes = useStore(s => s.res.analyze_themes_response)
  const filters = useStore(s => s.filters)

  const waiting = !themes?.first && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <LinearProgress />
  }

  if (!themes?.first) {
    return <Typography>Nothing to summarize (try adjusting date range)</Typography>
  }

  // sent2face(reply_.sentiment)} {reply_.summary}
  // const renderTerms = terms => {
  //   if (!terms) {return null}
  //   return terms.map((t, i) => <>
  //     <code>{t}</code>
  //     {i < terms.length - 1 ? ' · ' : ''}
  //   </>)
  // }

  function renderTheme(theme: analyze_themes_response, i: number) {
    return <Box key={theme.id}>
      <Typography>{theme.summary}</Typography>
      <Stack direction="row" spacing={2}>
        {theme.keywords.map(kw => <Chip key={kw} label={kw} />)}
      </Stack>
    </Box>
  }

  return <>
    {themes.rows.map(renderTheme)}
  </>

  // const themes_ =_.sortBy(reply.themes, 'n_entries').slice().reverse()
  // if (!themes_.length) {
  //   return <p>No patterns found in your entries yet, come back later</p>
  // }
  // return <>
  //   {<div>
  //     <h5>Top terms</h5>
  //     <p>{renderTerms(reply.terms)}</p>
  //     <hr/>
  //   </div>}
  //   {themes_.map((t, i) => (
  //     <div key={`${i}-${t.length}`} className='mb-3'>
  //       <h5>{sent2face(t.sentiment)} {t.n_entries} Entries</h5>
  //       <p>
  //         {renderTerms(t.terms)}
  //         {t.summary && <p><b>Summary</b>: {t.summary}</p>}
  //       </p>
  //       <hr />
  //     </div>
  //   ))}
  //   <p>Does the output seem off? Try <BsGear /> Advanced.</p>
  // </>
}
