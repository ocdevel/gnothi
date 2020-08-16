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
  FaTags,
  FaRegListAlt,
  FaTextHeight,
  FaRobot,
  FaQuestion,
  FaCubes,
  FaBook,
  FaRegFileArchive
} from 'react-icons/fa'
import Entry from "./Entry"
import './Entries.css'

export default function Entries({fetch_, as, aiStatus, setServerError}) {
  const [entries, setEntries] = useState([])
  const [notShared, setNotShared] = useState(false)
  const [tool, setTool] = useState('entries')
  const [page, setPage] = useState(0)
  let [searchEnabled, setSearchEnabled] = useState(false)
  let [search, setSearch] = useState('')
  let [tags, setTags] = useState({})

  // clean up
  tags = _.pickBy(tags, v => v)
  search = search.toLowerCase()

  let history = useHistory()
  let match = useRouteMatch()

  const fetchEntries = async () => {
    const {data, code, message} = await fetch_('entries', 'GET')
    if (code === 401) {return setNotShared(message)}
    setEntries(data)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  if (notShared) {return <h5>{notShared}</h5>}

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const changeSearch = e => setSearch(e.target.value)

  const setTags_ = (tags_) => {
    setTags(tags_)
    setPage(0)
  }

  const toggleSearch = () => {
    if (tool !== 'entries') {setTool('entries')}
    if (searchEnabled) {setSearch('')}
    setSearchEnabled(!searchEnabled)
  }

  const renderEntry = e => {
    const gotoForm_ = () => gotoForm(e.id)
    const sentiment = sent2face(e.sentiment)
    const title = e.title || e.title_summary
    const summary = e.text_summary
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
            {summary === e.text ? (
                <>{sentiment}{summary}</>
            ) : (
                <SimplePopover text="Summary is machine-generated from entry. Click to read the original.">
                  <div>
                    <div className='blur-summary'>
                      {sentiment}{summary}
                    </div>
                    <span className='anchor'>Read original</span>
                  </div>
                </SimplePopover>
            )}
          </div>
          <hr/>
        </td>
      </tr>
    )
  }

  const renderTool = t => {
    const popover = {
      query: "Ask a question about entries",
      summarize: "Generate summaries of entries",
      themes: "Common themes across entries",
      books: "Self-help book recommendations based on entries"
    }[t]

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
    return <SimplePopover text={popover}>
      <Button {...btnOpts}>
        {{
          query: <><FaQuestion /> Ask</>,
          summarize: <><FaTextHeight /> Summarize</>,
          //summarize: <><FaRegFileArchive /> Summarize</>,
          themes: <><FaCubes /> Themes</>,
          books: <><FaBook /> Books</>
        }[t]}
      </Button>
    </SimplePopover>
  }

  const renderTools = () => {
    return <>
      <div>
        <SimplePopover text="Tags">
          <FaTags />
        </SimplePopover>
        <span className='tools-divider' />
        {/*TODO reconsider preSelectMain for !!as. Eg, currently don't want therapist seeing Dream by default.*/}
        <Tags
          as={as}
          fetch_={fetch_}
          server={false}
          selected={tags}
          setSelected={setTags_}
          preSelectMain={true}
        />{' '}
      </div>
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
    </>
  }

  const renderEntries = () => {
    let filtered = _(entries)
      .filter(e => _.reduce(tags, (m, v, k) => e.entry_tags[k] || m, false))
      .filter(e => !search.length || ~(e.title + e.text).toLowerCase().indexOf(search))
      .value()

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
    const desc = {
      query: `Ask a question about your entries.`,
      themes: `Show common recurring themes across your entries.`,
      summarize: `Summarize your entries for an overview.`,
      books: `Generate a list of recommended self-help books which might help you, based on your entries.`,
    }[tool]
    const args = {fetch_, as, tags, aiStatus}
    const comp = {
      query: <Query {...args} />,
      themes: <Themes {...args} />,
      summarize: <Summarize {...args} />,
      books: <Books {...args} />
    }[tool]
    return <>
      <Alert variant='info'>
        <div>{desc}</div>
        <small className="text-muted">Select <FaTags /> tags above to limit entries, or all tags are used.</small>
      </Alert>
      {comp}
    </>
  }

  return (
    <div>
      <Switch>
        <Route path={`${match.url}/entry/:entry_id`}>
          <Entry fetch_={fetch_} as={as} setServerError={setServerError} update={fetchEntries} />
        </Route>
        {!as && (
          <Route path={`${match.url}/entry`}>
            <Entry fetch_={fetch_} as={as} setServerError={setServerError} update={fetchEntries} />
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
