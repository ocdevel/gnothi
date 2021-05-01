import React, {useCallback, useEffect, useState} from "react"
import {Route, Switch, useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'

import {
  Button,
} from "react-bootstrap"
import Teaser from './Teaser'
import {EntryPage} from "./Entry"
import {useStoreState, useStoreActions} from "easy-peasy";
import {NotesAll, NotesNotifs} from "./Notes";
import {MainTags} from "../Tags";
import MediaQuery from 'react-responsive'
import Fields from "../Fields/Fields";
import Search from './Search'

import {Add as AddIcon} from '@material-ui/icons'
import {List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Fab,
  Pagination, Grid, Button as MButton, Alert, Card} from '@material-ui/core'

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
      return <Alert severity='info'>No entries. If you're a new user, click <Button variant="primary" size='sm' disabled>New Entry</Button> above. If you're a therapist, click your email top-right and select a client; you'll then be in that client's shoes.</Alert>
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
        <Grid container justifyContent="space-between" alignItems="center" spacing={3}>
          <Grid item style={{flex: 1}}>
            <Search trigger={setSearch} />
          </Grid>
          <Grid item>
            {as ? null : <MButton
              color="primary"
              variant="contained"
              onClick={() => gotoForm()}
              label="New Entry"
            >New Entry</MButton>}
          </Grid>
        </Grid>
        {renderEntries()}
      </Grid>
      <Grid item sm={12} lg={4} md={5}>
        <Fields  />
        <NotesAll />
      </Grid>
    </Grid>
  </>
}
