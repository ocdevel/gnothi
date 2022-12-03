import React from 'react'
import Grid from '@mui/material/Grid'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {Helmet} from "react-helmet-async";
const Upsert = React.lazy(() => import("./Upsert"))
const Fields = React.lazy(() => import("../../Fields/Fields"))

export default function New() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  function onCreate() {
    if (searchParams.get('redirect') !== 'false') {
      navigate('/j/list')
    }
  }

  return  <>
    <Helmet>
      <title>New Entry</title>
    </Helmet>
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        <Upsert onClose={onCreate}/>

      </Grid>
      <Grid item sm={12} lg={4} md={5}>
          <Fields  />
      </Grid>
    </Grid>
  </>
}
