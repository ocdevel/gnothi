import React, {useCallback, useEffect, useState} from "react"
import {Route, Switch, useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'

import {
  Button,
  ButtonGroup,
  Form,
  Alert,
  Row,
  Col,
  InputGroup, Card,
} from "react-bootstrap"
import Teaser from './Teaser'
import {EntryPage} from "./Entry"
import {useStoreState, useStoreActions} from "easy-peasy";
import {NotesAll, NotesNotifs} from "./Notes";
import {MainTags} from "../Tags";
import MediaQuery from 'react-responsive'
import Sidebar from "../Sidebar";
import Search from './Search'

import {Add as AddIcon} from '@material-ui/icons'
import {List, ListItem, ListItemIcon, ListItemText, Divider, Typography, Fab,
  Pagination, Grid, Button as MButton} from '@material-ui/core'

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
      return <Alert variant='info'>No entries. If you're a new user, click <Button variant="primary" size='sm' disabled>New Entry</Button> above. If you're a therapist, click your email top-right and select a client; you'll then be in that client's shoes.</Alert>
    }

    const pageSize = 10
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    const nPages = _.ceil(filtered.length / pageSize)
    const changePage = (e, p) => setPage(p)

    return <>
      <List>
        {filteredPage.map(eid => <Teaser eid={eid} gotoForm={gotoForm} key={eid}/> )}
      </List>
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

    <Row>
      <Col>
        {MainTags}
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Search trigger={setSearch} />
          </Grid>
          <Grid item xs='auto'>
            {as ? null : <MButton
              color="primary"
              variant="contained"
              onClick={() => gotoForm()}
              label="New Entry"
            >New Entry</MButton>}
          </Grid>
        </Grid>
        {renderEntries()}
      </Col>
      <Col lg={4} md={5}>
        <Sidebar  />
        <NotesAll />
      </Col>
    </Row>
  </>
}
