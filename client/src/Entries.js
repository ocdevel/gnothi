import React, {useEffect, useState} from "react"
import {useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'
import {sent2face, SimplePopover} from "./utils"
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
  FaToolbox,
  FaRobot,
  FaQuestion,
  FaCubes,
  FaBook,
  FaRegNewspaper
} from 'react-icons/fa'

export default function Entries({fetch_, as}) {
  const [entries, setEntries] = useState([])
  const [notShared, setNotShared] = useState(false)
  const [tool, setTool] = useState()
  const [garble, setGarble] = useState(false)
  const [page, setPage] = useState(0)
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

  const toggleTool = t => {
    setTool(tool === t ? null : t)
    setSearch('')
  }
  const changeSearch = e => setSearch(e.target.value)

  const setTags_ = (tags_) => {
    setTags(tags_)
    setPage(0)
  }

  const renderEntry = e => {
    const gotoForm_ = () => gotoForm(e.id)
    const sentiment = sent2face(e.sentiment)
    const title = garble ? "pretium fusce id velit ut tortor pretium viverra suspendisse potenti"
        : (e.title || e.title_summary);
    let summary = garble ? "scelerisque eu ultrices vitae auctor eu augue ut lectus arcu bibendum at varius vel pharetra vel turpis nunc eget lorem dolor sed viverra ipsum nunc aliquet bibendum enim facilisis gravida neque convallis a cras semper auctor neque vitae tempus quam pellentesque nec nam aliquam sem et tortor consequat id porta nibh venenatis cras sed felis eget velit aliquet sagittis id consectetur purus ut faucibus"
        : e.text_summary;
    summary = <span>{summary}</span>
    return (
      <tr key={e.id}>
        <td>
          <div
            onClick={gotoForm_}
            className='cursor-pointer'
          >
            <h5>{moment(e.created_at).format('MM/DD/YYYY ha')}</h5>
            <h6>{title}</h6>
          </div>
          <p>
            {sentiment}
            {e.text_summary === e.text ? summary : (
              <SimplePopover text="Summary is machine-generated from your entry's text">
                {summary}
              </SimplePopover>
            )}
          </p>
        </td>
      </tr>
    )
  }

  const renderTool = t => {
    const popover = {
      search: "Search entries",
      query: "Ask a question about entries",
      summarize: "Generate summaries of entries",
      themes: "Common themes across entries",
      books: "Self-help book recommendations based on entries"
    }[t]
    return (
      <SimplePopover text={popover}>
        <Button
          size='sm'
          variant={t === tool ? 'dark' : 'outline-dark'}
          onClick={() => toggleTool(t)}
        >
          {{
            search: <FaSearch />,
            query: <FaQuestion />,
            summarize: <FaRegNewspaper />,
            themes: <FaCubes />,
            books: <FaBook />
          }[t]}
        </Button>
      </SimplePopover>
    )
  }

  const renderTools = () => {
    return <>
      <div>
        <SimplePopover text="Tags">
          <FaTags />
        </SimplePopover>
        <span className='tools-divider' />
        <Tags
          as={as}
          fetch_={fetch_}
          server={false}
          selected={tags}
          setSelected={setTags_}
        />{' '}
      </div>
      <div style={{marginTop:5}}>
        <SimplePopover text="AI Tools">
          <FaRobot />
        </SimplePopover>
        <span className='tools-divider' />
        {renderTool('search')}{' '}
        {renderTool('query')}{' '}
        {renderTool('summarize')}{' '}
        {renderTool('themes')}{' '}
        {renderTool('books')}
        {tool === 'search' && <Form.Control
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
      .filter(e => _.reduce(tags, (m, v, k) => e.entry_tags[k] && m, true))
      .filter(e => !search.length || ~(e.title + e.text).toLowerCase().indexOf(search))
      .value()

    const pageSize = 7
    const usePaging = !search.length && filtered.length > pageSize
    const filteredPage = !usePaging ? filtered :
        filtered.slice(page*pageSize, page*pageSize + pageSize)
    return <>
      {filteredPage.map(renderEntry)}
      {usePaging && (
        <ButtonGroup aria-label="Page">
          {_.times(_.ceil(filtered.length / pageSize), p => (
            <Button
              variant={p === page ? 'dark' : 'outline-dark'}
              onClick={() => setPage(p)}
            >{p}</Button>
          ))}
        </ButtonGroup>
      )}
      <hr />
      <Form.Group controlId="garble">
        <Form.Check
          type="checkbox"
          label="Garble Entries"
          checked={garble}
          onChange={() => setGarble(!garble)}
        />
        <Form.Text>You're showing someone this app, but don't want them to see the entries.</Form.Text>
      </Form.Group>
    </>
  }

  const renderMain = () => {
    if (!tool || tool === 'search') {
      return renderEntries()
    }
    const desc = {
      query: `Ask a question about your entries.`,
      themes: `Show common recurring themes across your entries.`,
      summarize: `Summarize your entries for an overview.`,
      books: `Generate a list of recommended self-help books which might help you, based on your entries.`,
    }[tool]
    const args = {fetch_, as, tags}
    const comp = {
      query: <Query {...args} />,
      themes: <Themes {...args} />,
      summarize: <Summarize {...args} />,
      books: <Books {...args} />
    }[tool]
    return <>
      <Alert variant='info'>
        <div>{desc}</div>
        <small className="text-muted">Select <FaTags /> tags above to limit entries.</small>
      </Alert>
      {comp}
    </>
  }

  return (
    <div>
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
