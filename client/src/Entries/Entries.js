import React, {useCallback, useEffect, useState} from "react"
import {Route, Switch, useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'
import {
  sent2face,
  SimplePopover,
  fmtDate,
  bsSizes
} from "../utils"
import {
  Button,
  ButtonGroup,
  Form,
  Alert,
  Row,
  Col,
  InputGroup, Card,
} from "react-bootstrap"
import {
  FaSearch,
} from 'react-icons/fa'
import {EntryPage} from "./Entry"
import './Entries.scss'
import {useStoreState, useStoreActions} from "easy-peasy";
import {NotesAll, NotesNotifs} from "./Notes";
import {MainTags} from "../Tags";
import MediaQuery from 'react-responsive'
import Sidebar from "../Sidebar";


export function EntryTeaser({eid, gotoForm}) {
  const e = useStoreState(s => s.ws.data['entries/entries/get'].obj?.[eid])
  const [hovered, setHovered] = useState(false)
  const onHover = () => setHovered(true)
  const onLeave = () => setHovered(false)

  if (!e) {return null}

  const title = e.title || e.title_summary
  const isSummary = e.text_summary && e.text !== e.text_summary
  const summary = e.text_summary || e.text
  const sentiment = e.sentiment && sent2face(e.sentiment)
  return (
    <Card.Body
      key={e.id}
      onClick={() => gotoForm(eid)}
      className={`cursor-pointer ${hovered ? 'shadow-lg' : 'border-bottom'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Card.Title>
        {title}
      </Card.Title>
      <Card.Subtitle className='mb-2 text-muted'>
        {fmtDate(e.created_at)}
      </Card.Subtitle>
      {isSummary ? <>
        <div>
          {sentiment}{summary}
        </div>
        {hovered && <div className='text-info'>You're viewing an AI-generated summary of this entry. Click to read the original.</div>}
      </> : <div>
        {sentiment}{summary}
      </div>}
      <NotesNotifs entry_id={e.id} />
    </Card.Body>
  )
}

/**
 * Entries() is expensive, so isolate <Search /> and only update the Entries.search
 * periodically (debounce)
 */
function Search({trigger}) {
  let [search, setSearch] = useState('')

  const trigger_ = useCallback(_.debounce(trigger, 200), [])

  function changeSearch(e) {
    const s = e.target.value.toLowerCase()
    setSearch(s)
    trigger_(s)
  }

  return <div className='mb-3'>
    <Form.Label htmlFor="formSearch" srOnly>Search</Form.Label>
    <InputGroup>
      <InputGroup.Prepend>
        <InputGroup.Text><FaSearch /></InputGroup.Text>
      </InputGroup.Prepend>
      <Form.Control
        id='formSearch'
        type="text"
        value={search}
        onChange={changeSearch}
        placeholder="Search"
      />
    </InputGroup>
  </div>
}


export function Entries({group_id=null}) {
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

    const pageSize = 7
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    return <Card>
      {filteredPage.map(eid => <EntryTeaser eid={eid} gotoForm={gotoForm} key={eid}/> )}
      <Card.Footer>
        {usePaging && <div style={{overflowX: 'scroll'}}>
          <ButtonGroup aria-label="Page">
            {_.times(_.ceil(filtered.length / pageSize), p => (
              <Button key={p}
                variant={p === page ? 'dark' : 'outline-dark'}
                onClick={() => setPage(p)}
              >{p}</Button>
            ))}
          </ButtonGroup>
        </div>}
      </Card.Footer>
    </Card>
  }

  const _search = <Search trigger={setSearch} />

  const _newButton = as ? null : <div className='mb-3'>
    <Button
      variant="primary"
      onClick={() => gotoForm()}
    >New Entry</Button>
  </div>

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
        <MediaQuery maxDeviceWidth={bsSizes.md - 1}>
          {_newButton}
          {_search}
        </MediaQuery>
        {renderEntries()}
      </Col>
      <Col lg={4} md={5}>
        <MediaQuery minDeviceWidth={bsSizes.md}>
          {_newButton}
          {_search}
        </MediaQuery>
        <Sidebar  />
        <NotesAll />
      </Col>
    </Row>
  </>
}
