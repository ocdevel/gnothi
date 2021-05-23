import React, {useCallback, useEffect, useState} from "react"
import {Link, Route, Switch, useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'

import Teaser from './Teaser'
import {EntryPage} from "./Entry"
import {useStoreState, useStoreActions} from "easy-peasy";
import {NotesAll, NotesNotifs} from "./Notes";
import {MainTags} from "../Tags";
import Fields from "../Fields/Fields";
import Search from './Search'

import Pagination from '@material-ui/core/Pagination'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import {Alert2, ToolbarHeader} from "../Helpers/Misc";
import Fab from "@material-ui/core/Fab";

export function EntriesToolbar() {
  const as = useStoreState(s => s.user.as)
  const props = {component: Link, to: '/j/entry'}
  const buttons = as ? null : <>
    {/*<Fab variant="extended" size='medium' {...props}>New Entry</Fab>*/}
    <Button variant='contained' color='info' {...props}>New Entry</Button>
  </>
  return <ToolbarHeader title='Journal' buttons={buttons}/>
}

export default function Entries({group_id=null}) {
  const as = useStoreState(s => s.user.as)
  const entries = useStoreState(s => s.ws.data['entries/entries/get'])
  const entriesRes = useStoreState(s => s.ws.res['entries/entries/get'])
  const selected = useStoreState(s => s.ws.data.selectedTags)

  const {arr, obj} = entries

  const [page, setPage] = useState(0)
  let [search, setSearch] = useState('')

  let history = useHistory()
  let match = useRouteMatch()

  useEffect(() => {
    setPage(0)
  }, [selected])

  if (entriesRes?.code === 403) {
    return <h5>{entriesRes.detail}</h5>
  }

  let filtered = _(arr || [])
      .filter(eid => _.reduce(selected, (m, v, k) => obj[eid].entry_tags[k] || m, false))
      .filter(eid => !search.length || ~(obj[eid].title + obj[eid].text).toLowerCase().indexOf(search))
      .value()

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const renderEntries = () => {
    if (!filtered.length) {
      return <Alert2 severity='info'>No entries. If you're a new user, click <Button color="primary" size='small' variant='contained' disabled>New Entry</Button> above. If you're a therapist, select a client in left-sidebar > Account > [email]. You'll then be in that client's shoes.</Alert2>
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
    <Switch>
      <Route path={`${match.url}/entry/:entry_id`}>
        <EntryPage />
      </Route>
      {!as && (
        <Route path={`${match.url}/entry`}>
          <EntryPage />
        </Route>
      )}
    </Switch>

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
