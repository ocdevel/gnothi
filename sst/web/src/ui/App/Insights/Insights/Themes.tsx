import React, {useCallback, useEffect, useState} from "react"
import {sent2face} from "@gnothi/web/src/utils/utils"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import {useStore} from "@gnothi/web/src/data/store"
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import {insights_themes_response} from '@gnothi/schemas/insights'
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import {LinearProgress} from "@mui/material";
import {Insight} from "./Utils";
import Divider from "@mui/material/Divider";

export default function Themes({view}: Insight) {
  const submitted = useStore(useCallback(s => !!s.res.insights_get_response?.hash?.[view], [view]))
  const themes = useStore(useCallback(s => s.res.insights_themes_response?.hash?.[view], [view]))
  const filters = useStore(s => s.filters)

  const waiting = !themes && submitted

  // 26fecb16 - specify summary length

  if (waiting) {
    return <LinearProgress />
  }

  if (!themes) {
    return <Typography>There are not enough entries selected to generate themes (try adjusting date range)</Typography>
  }

  // sent2face(reply_.sentiment)} {reply_.summary}
  // const renderTerms = terms => {
  //   if (!terms) {return null}
  //   return terms.map((t, i) => <>
  //     <code>{t}</code>
  //     {i < terms.length - 1 ? ' · ' : ''}
  //   </>)
  // }

  function renderTheme(theme: insights_themes_response['themes'][number], i: number) {
    return <Box key={theme.id} sx={{my:1}}>
      
      <Typography 
        marginBottom={1}
        variant="body1"
        fontWeight={500}
        color="primary">{theme.word}</Typography>
        <Typography
          variant="body2"
          color="primary"
          mt={-1}
          mb={1}>
        AI took note of the following:
      </Typography>

      <Typography 
        variant='body1'
        marginBottom={2}>{theme.summary}</Typography>
      
      <Stack 
        display="flex"
        alignContent="flex-start"
        justifyContent="flex-start"
        flexWrap='wrap'
        direction="row"
        >
        {theme.keywords.map((kw: string) => <Chip sx={{marginRight:1, marginBottom:2}} key={kw} label={kw} />)}
      </Stack>

      {/*<Divider sx={{marginTop: 2, marginBottom: 3}} />*/}
    </Box>
  }

  return <>
    {themes.themes.slice(0,1).map(renderTheme)}
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
