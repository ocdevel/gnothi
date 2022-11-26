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
import Search from './Search'

import Pagination from '@mui/material/Pagination'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import {Alert2, ToolbarHeader} from "../../../Components/Misc";
import Fab from "@mui/material/Fab";
const Insights = React.lazy(() => import('../../Insights'))


export default function List({group_id=null}) {
  const as = useStore(s => s.user.as)
  const entries = useStore(s => s.res.entries_list_response)
  const selected = useStore(s => s.selectedTags)

  const ids = entries?.ids || []
  const hash = entries?.hash || {}

  const [page, setPage] = useState(0)
  let [search, setSearch] = useState('')

  let navigate = useNavigate()

  useEffect(() => {
    setPage(0)
  }, [selected])

  if (entries?.res?.error && entries.res.code === 403) {
    return <h5>{entries.res.data}</h5>
  }

  let filtered = ids
      // FIXME entry_tags
      // .filter(eid => _.reduce(selected, (m, v, k) => hash[eid].tags[k] || m, false))
      .filter(eid => !search.length || ~(hash[eid].entry.title + hash[eid].entry.text).toLowerCase().indexOf(search))

  const gotoForm = (entry_id?: string) => {
    const p = (entry_id ? `/j/${entry_id}/view` : 'entry')
    navigate(p)
  }

  const renderEntries = () => {
    if (!filtered.length) {
      return <Alert2 severity='info'>No entries. If you're a new user, click <Button color="primary" size='small' variant='contained' disabled>New Entry</Button> above. If you're a therapist, select a client in left-sidebar {'>'} Account {'>'} [email]. You'll then be in that client's shoes.</Alert2>
    }

    const pageSize = 10
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    const nPages = _.ceil(filtered.length / pageSize)
    const changePage = (e, p) => setPage(p)

    return <>
      {filteredPage.map(eid => <Teaser eid={eid} gotoForm={gotoForm} key={eid}/> )}
      {usePaging && <Pagination count={nPages} page={page} onChange={changePage} />}
    </>
  }

  return <>
    <Helmet>
      <title>Entries</title>
    </Helmet>
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        {MainTags}
        <Search trigger={setSearch} />
        {renderEntries()}
      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Insights />
        <NotesAll />
      </Grid>
    </Grid>
  </>
}
