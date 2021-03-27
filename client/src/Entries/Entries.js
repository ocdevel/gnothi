import React, {useEffect, useState} from "react"
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
import Entry from "./Entry"
import './Entries.scss'
import {useStoreState, useStoreActions} from "easy-peasy";
import {NotesAll, NotesNotifs} from "./Notes";
import {MainTags} from "../Tags";
import MediaQuery from 'react-responsive'
import Sidebar from "../Sidebar";


function EntryTeaser({e, gotoForm}) {
  const [hovered, setHovered] = useState(false)
  const onHover = () => setHovered(true)
  const onLeave = () => setHovered(false)

  const title = e.title || e.title_summary
  const isSummary = e.text_summary && e.text !== e.text_summary
  const summary = e.text_summary || e.text
  const sentiment = e.sentiment && sent2face(e.sentiment)
  let klass = 'cursor-pointer mb-3 entries-entry'
  if (hovered) {
    klass += ' hovered shadow-sm'
  }
  return (
    <Card.Body
      key={e.id}
      onClick={() => gotoForm(e.id)}
      className={klass}
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
        <div className='blur-summary'>
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


export default function Entries() {
  const as = useStoreState(s => s.ws.as)
  const entries = useStoreState(s => s.ws.data['entries/entries/get'])
  const entriesRes = useStoreState(s => s.ws.res['entries/entries/get'])
  const selected = useStoreState(s => s.ws.data.selectedTags)

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

  let filtered = _(entries || [])
      .filter(e => _.reduce(selected, (m, v, k) => e.entry_tags[k] || m, false))
      .filter(e => !search.length || ~(e.title + e.text).toLowerCase().indexOf(search))
      .value()

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const changeSearch = e => setSearch(e.target.value.toLowerCase())

  const renderEntries = () => {
    if (!filtered.length) {
      return <Alert variant='info'>No entries. If you're a new user, click <Button variant="primary" size='sm' disabled>New Entry</Button> above. If you're a therapist, click your email top-right and select a client; you'll then be in that client's shoes.</Alert>
    }

    const pageSize = 7
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    return <Card>
      {filteredPage.map(e => <EntryTeaser e={e} gotoForm={gotoForm} key={e.id}/> )}
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

  const _search = <div className='mb-3'>
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

  const _newButton = as ? null : <div className='mb-3'>
    <Button
      variant="primary"
      onClick={() => gotoForm()}
    >New Entry</Button>
  </div>

  return <>
    <Switch>
      <Route path={`${match.url}/entry/:entry_id`}>
        <Entry />
      </Route>
      {!as && (
        <Route path={`${match.url}/entry`}>
          <Entry />
        </Route>
      )}
    </Switch>

    <Row>
      <Col>
        {MainTags}
        <MediaQuery maxWidth={bsSizes.md}>
          {_newButton}
          {_search}
        </MediaQuery>
        {renderEntries()}
      </Col>
      <Col lg={4} md={5}>
        <MediaQuery minWidth={bsSizes.md}>
          {_newButton}
          {_search}
        </MediaQuery>
        <Sidebar  />
        <NotesAll />
      </Col>
    </Row>
  </>
}
