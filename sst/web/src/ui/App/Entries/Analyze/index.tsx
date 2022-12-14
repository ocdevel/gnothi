import React, {useCallback, useEffect, useState} from "react"
import {Link, Route, Routes, useNavigate, Outlet} from "react-router-dom"
import _ from 'lodash'
import {Api} from "@gnothi/schemas"
import {Helmet} from 'react-helmet-async'

import Teaser from './Teaser'
import {useStore} from '../../../../data/store'
import {NotesAll, NotesNotifs} from "../Notes";
import {MainTags} from "../../Tags/Tags";
import Fields from "../../Fields/Fields";
import Search from './Filters/Search'

import Pagination from '@mui/material/Pagination'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import {Alert2, ToolbarHeader} from "../../../Components/Misc";
import Fab from "@mui/material/Fab";
import Filters from './Filters'
import Analyze from './Analyze'
import Entries from "./Entries"
import Ask from './Analyze/Ask'


export default function List({group_id=null}) {
  return <>
    <Helmet>
      <title>Analyze</title>
    </Helmet>
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        <Filters />
        <Ask />
        <Entries />
      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Analyze />
        <NotesAll />
      </Grid>
    </Grid>
  </>
}
