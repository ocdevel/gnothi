import React, {useCallback, useEffect, useState} from "react"
import {Link, Route, Routes, useNavigate, Outlet} from "react-router-dom"
import _ from 'lodash'
import {Api} from "../../../../data/schemas"

import Teaser from '../Teaser'
import EntryPage from "../View/Entry"
import {useStore} from '../../../../data/store'
import {NotesAll, NotesNotifs} from "../Notes";
import {MainTags} from "../../Tags/Tags";
import Fields from "../../Fields/Fields";
import Search from '../Search'

import Pagination from '@mui/material/Pagination'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import {Alert2, ToolbarHeader} from "../../../Components/Misc";
import Fab from "@mui/material/Fab";


export default function List({group_id=null}) {
  const as = useStore(s => s.as)
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

  let filtered = _(ids)
      // FIXME entry_tags
      // .filter(eid => _.reduce(selected, (m, v, k) => hash[eid].entry_tags[k] || m, false))
      .filter(eid => !search.length || ~(hash[eid].title + hash[eid].text).toLowerCase().indexOf(search))
      .value()

  const gotoForm = (entry_id?: string) => {
    const p = (entry_id ? `entry/${entry_id}` : 'entry')
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
    <Grid container spacing={2}>
      <Grid item sm={12} md={7} lg={8}>
        {MainTags}
        <Search trigger={setSearch} />
        {renderEntries()}
      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Fields  />
        <NotesAll />
      </Grid>
    </Grid>
  </>
}
