import React, {useEffect, useState} from "react"
import {useHistory, useRouteMatch} from "react-router-dom"
import _ from 'lodash'
import {sent2face} from "./utils"
import {
  Button,
  Popover,
  OverlayTrigger,
  Form
} from "react-bootstrap"
import moment from "moment"
import Tags from "./Tags";

const summaryTip = (
  <Popover>
    <Popover.Content>
      Summary is machine-generated from your entry's text
    </Popover.Content>
  </Popover>
)

export default function Entries({fetch_, as}) {
  const [entries, setEntries] = useState([])
  const [notShared, setNotShared] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
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

  const toggleSearch = () => setShowSearch(!showSearch)
  const changeSearch = e => setSearch(e.target.value)

  const filtered = _(entries)
    .filter(e => _.reduce(tags, (m, v, k) => e.entry_tags[k] && m, true))
    .filter(e => !search.length || ~(e.title + e.text).toLowerCase().indexOf(search))
    .value()

  const renderEntry = e => {
    const gotoForm_ = () => gotoForm(e.id)
    const sentiment = sent2face(e.sentiment)
    const textSummary = <span>{e.text_summary}</span>
    return (
      <tr key={e.id}>
        <td>
          <div
            onClick={gotoForm_}
            className='cursor-pointer'
          >
            <h5>{moment(e.created_at).format('MM/DD/YYYY ha')}</h5>
            <h6>{e.title || e.title_summary}</h6>
          </div>
          <p>
            {sentiment}
            {e.text_summary === e.text ? textSummary : (
              <OverlayTrigger overlay={summaryTip} trigger={["hover","focus"]}>
                {textSummary}
              </OverlayTrigger>
            )}
          </p>
        </td>
      </tr>
    )
  }

  return (
    <div>
      {!as && <Button
        style={{float: 'right'}}
        variant="success"
        className='bottom-margin'
        onClick={() => gotoForm()}
      >New Entry</Button>}

      Show:&nbsp;
      <Tags as={as} fetch_={fetch_} server={false} selected={tags} setSelected={setTags} />
      {' '}<Button size='sm' variant='light' onClick={toggleSearch}>🔎</Button>
      {showSearch && <Form.Control
        inline
        type="text"
        value={search}
        onChange={changeSearch}
        placeholder="Search"
      />}
      <hr />
      {filtered.map(renderEntry)}
    </div>
  )
}
