import React, {useEffect, useState} from "react"
import {Route, Switch, useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'
import {sent2face, SimplePopover, fmtDate} from "./utils"
import {
  Button,
  ButtonGroup,
  Form,
  Alert
} from "react-bootstrap"
import moment from "moment"
import Tags from "./Tags"
import Summarize from "./Summarize"
import Books from "./Books"
import Themes from "./Themes"
import Query from "./Query"
import {
  FaSearch,
  FaThumbsUp,
  FaTags,
  FaRegListAlt,
  FaTextHeight,
  FaRobot,
  FaQuestion,
  FaCubes,
  FaBook,
  FaLock
} from 'react-icons/fa'
import Entry from "./Entry"
import './Entries.css'

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from './redux/actions'

 const tools = {
  entries: {minEntries: 0},
  query: {
    minEntries: 1,
    label: "Ask",
    icon: <FaQuestion />,
    popover: "Ask a question about entries",
    description: `Ask a question about your entries.`,
    render: args =>  <Query {...args} />,
  },
  summarize: {
    minEntries: 1,
    label: "Summarize",
    icon: <FaTextHeight />,
    popover: "Generate summaries of entries",
    description: `Summarize your entries for an overview.`,
    render: args => <Summarize {...args} />,
  },
  themes: {
    minEntries: 3,
    popover: "Common themes across entries",
    label: "Themes",
    icon: <FaCubes />,
    description: `Show common recurring themes across your entries.`,
    render: args => <Themes {...args} />,
  },
  books: {
    minEntries: 3,
    label: "Books",
    icon: <FaBook />,
    popover: "Self-help book recommendations based on entries",
    description: `Generate AI-recommended self-help books, based on your entries.`,
    render:  args => <Books {...args} />,
  },
}

export default function Entries() {
  const [entries, setEntries] = useState([])
  const [notShared, setNotShared] = useState(false)
  const [tool, setTool] = useState('entries')
  const [page, setPage] = useState(0)
  let [searchEnabled, setSearchEnabled] = useState(false)
  let [search, setSearch] = useState('')
  const selected = useSelector(state => state.selectedTags)

  const dispatch = useDispatch()
  const as = useSelector(state => state.as)

  let history = useHistory()
  let match = useRouteMatch()

  const fetchEntries = async () => {
    const {data, code, message} = await dispatch(fetch_('entries', 'GET'))
    if (code === 401) {return setNotShared(message)}
    setEntries(data)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [selected])

  if (notShared) {return <h5>{notShared}</h5>}

  let filtered = _(entries)
      .filter(e => _.reduce(selected, (m, v, k) => e.entry_tags[k] || m, false))
      .filter(e => !search.length || ~(e.title + e.text).toLowerCase().indexOf(search))
      .value()

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const changeSearch = e => setSearch(e.target.value.toLowerCase())

  const toggleSearch = () => {
    if (tool !== 'entries') {setTool('entries')}
    if (searchEnabled) {setSearch('')}
    setSearchEnabled(!searchEnabled)
  }

  const renderEntry = e => {
    const gotoForm_ = () => gotoForm(e.id)
    const title = e.title || e.title_summary
    const isSummary = e.text_summary && e.text !== e.text_summary
    const summary = e.text_summary || e.text
    const sentiment = e.sentiment && sent2face(e.sentiment)
    return (
      <tr key={e.id}>
        <td
          onClick={gotoForm_}
          className='cursor-pointer'
        >
          <div>
            <h5>{fmtDate(e.created_at)}</h5>
            <h6>{title}</h6>
          </div>
          <div>
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
          </div>
          <hr/>
        </td>
      </tr>
    )
  }

  let anyLocked = false;
  const renderTool = t => {
    const tObj = tools[t];
    const locked = filtered.length < tObj.minEntries;
    anyLocked = anyLocked || locked
    // const popover = locked ? "This feature unlocks with more entries" : tObj.popover;
    // const icon = locked ? <FaLock /> : tObj.icon;
    if (locked) {return null}

    const btnOpts = {
      size: 'sm',
      variant: t === tool ? 'dark' : 'outline-dark',
      onClick: () => setTool(t)
    }
    if (t === 'entries') {
      return <ButtonGroup>
        <Button {...btnOpts}><FaRegListAlt /> Entries</Button>
        <SimplePopover text="Search entries">
          <Button
            size='sm'
            variant={searchEnabled ? 'dark' : 'outline-dark'}
            onClick={toggleSearch}
          ><FaSearch /></Button>
        </SimplePopover>
      </ButtonGroup>
    }
    return <SimplePopover text={tObj.popover}>
      <Button {...btnOpts}>
        {tObj.icon} {tObj.label}
      </Button>
    </SimplePopover>
  }

  const renderTools = () => {
    return <>
      {tool !== 'books' && <div>
        <SimplePopover text="Tags">
          <FaTags/>
        </SimplePopover>
        <span className='tools-divider'/>
        {/*TODO reconsider preSelectMain for !!as. Eg, currently don't want therapist seeing Dream by default.*/}
        <Tags preSelectMain={true} />{' '}
      </div>}
      <div style={{marginTop:5}}>
        <SimplePopover text="AI Tools">
          <FaRobot />
        </SimplePopover>
        <span className='tools-divider' />
        {renderTool('entries')}{' '}
        {renderTool('summarize')}{' '}
        {renderTool('themes')}{' '}
        {renderTool('query')}{' '}
        {renderTool('books')}
        {searchEnabled && tool === 'entries' && <Form.Control
          ref={c => c && c.focus()}
          style={{marginTop:5}}
          inline
          type="text"
          value={search}
          onChange={changeSearch}
          placeholder="Search"
        />}
      </div>
      {anyLocked && <div className='text-muted'>
          <FaLock />
          <span className='tools-divider' />
          <small>More AI tools unlock with more entries</small>
      </div>}
    </>
  }

  const renderEntries = () => {
    if (!filtered.length) {
      return <Alert variant='info'>No entries. If you're a new user, click <Button variant="success" size='sm' disabled>New Entry</Button> above. If you're a therapist, click your email top-right and select a client; you'll then be in that client's shoes.</Alert>
    }

    const pageSize = 7
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    return <>
      {filteredPage.map(renderEntry)}
      {usePaging && (
        <ButtonGroup aria-label="Page">
          {_.times(_.ceil(filtered.length / pageSize), p => (
            <Button key={p}
              variant={p === page ? 'dark' : 'outline-dark'}
              onClick={() => setPage(p)}
            >{p}</Button>
          ))}
        </ButtonGroup>
      )}
    </>
  }

  const renderMain = () => {
    if (tool === 'entries') {
      return renderEntries()
    }
    const desc = tools[tool].description
    const comp = tools[tool].render()
    return <>
      <Alert variant='info'>
        <div>{desc}</div>
        <small className="text-muted">
          {tool === 'books' ? <>
            Use thumbs <FaThumbsUp /> to improve AI's recommendations.
          </> : <>
            Select <FaTags /> tags above to limit entries, or all tags are used.
          </>}
        </small>
      </Alert>
      {comp}
    </>
  }

  return (
    <div>
      <Switch>
        <Route path={`${match.url}/entry/:entry_id`}>
          <Entry update={fetchEntries} />
        </Route>
        {!as && (
          <Route path={`${match.url}/entry`}>
            <Entry update={fetchEntries} />
          </Route>
        )}
      </Switch>

      {!as && <Button
        style={{float: 'right'}}
        variant="success"
        className='bottom-margin'
        onClick={() => gotoForm()}
      >New Entry</Button>}

      {renderTools()}
      <hr />
      <div>
        {renderMain()}
      </div>
    </div>
  )
}
