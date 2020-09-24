import React, {useEffect, useState} from "react"
import {Route, Switch, useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'
import {sent2face, SimplePopover, fmtDate} from "../utils"
import {
  Button,
  ButtonGroup,
  Form,
  Alert,
  Row,
  Col,
  InputGroup,
  Card
} from "react-bootstrap"
import moment from "moment"
import {
  FaSearch,
} from 'react-icons/fa'
import Entry from "./Entry"
import './Entries.css'

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'

export default function Entries() {
  const [page, setPage] = useState(0)
  let [search, setSearch] = useState('')
  const selected = useSelector(state => state.selectedTags)

  const dispatch = useDispatch()
  const as = useSelector(state => state.as)
  const entries = useSelector(state => state.entries)

  let history = useHistory()
  let match = useRouteMatch()

  useEffect(() => {
    setPage(0)
  }, [selected])

  if (entries.code) {return <h5>{entries.message}</h5>}

  let filtered = _(entries)
      .filter(e => _.reduce(selected, (m, v, k) => e.entry_tags[k] || m, false))
      .filter(e => !search.length || ~(e.title + e.text).toLowerCase().indexOf(search))
      .value()

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const changeSearch = e => setSearch(e.target.value.toLowerCase())

  const renderEntry = e => {
    const gotoForm_ = () => gotoForm(e.id)
    const title = e.title || e.title_summary
    const isSummary = e.text_summary && e.text !== e.text_summary
    const summary = e.text_summary || e.text
    const sentiment = e.sentiment && sent2face(e.sentiment)
    return (
      <div
        key={e.id}
        onClick={gotoForm_}
        className='cursor-pointer bottom-margin'
      >
        <h5>
          <code className='text-muted'>{fmtDate(e.created_at)}</code>
          {' '}{title}
        </h5>
        <p>
          {isSummary ? (
              <SimplePopover text="Summary is machine-generated from entry. Click to read the original.">
                <div>
                  <div className='blur-summary'>
                    {sentiment}{summary}
                  </div>
                  <span className='anchor'>Read original</span>
                </div>
              </SimplePopover>
          ) : (
              <>{sentiment}{summary}</>
          )}
        </p>
        <hr/>
      </div>
    )
  }


  const renderEntries = () => {
    if (!filtered.length) {
      return <Alert variant='info'>No entries. If you're a new user, click <Button variant="success" size='sm' disabled>New Entry</Button> above. If you're a therapist, click your email top-right and select a client; you'll then be in that client's shoes.</Alert>
    }

    const pageSize = 7
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    return <div>
      {filteredPage.map(renderEntry)}
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
    </div>
  }

  const renderSearch = () => <>
    <Form.Label htmlFor="formSearch" srOnly>Search</Form.Label>
    <InputGroup>
      <InputGroup.Prepend>
        <InputGroup.Text><FaSearch /></InputGroup.Text>
      </InputGroup.Prepend>
      <Form.Control
        inline
        id='formSearch'
        type="text"
        value={search}
        onChange={changeSearch}
        placeholder="Search"
      />
    </InputGroup>
  </>

  return (
    <div>
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

      <Row style={{marginTop:5}}>
        <Col lg={10} md={8}>
          {renderSearch()}
        </Col>
        <Col lg={2} md={4}>
          {!as && <Button
            variant="success"
            className='bottom-margin'
            onClick={() => gotoForm()}
          >New Entry</Button>}
        </Col>
      </Row>
      <br />
      {renderEntries()}
    </div>
  )
}
