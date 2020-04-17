import React, {useEffect, useState} from "react"
import {useHistory, useRouteMatch} from "react-router-dom"
import {sent2face} from "./utils"
import {
  Button,
  Table,
  Popover,
  OverlayTrigger,
  Tabs,
  Tab
} from "react-bootstrap"
import moment from "moment"
import Themes from './Themes'
import Books from "./Books"

const summaryTip = (
  <Popover>
    <Popover.Content>
      Summary is machine-generated from your entry's text
    </Popover.Content>
  </Popover>
);

export default function Entries({fetch_}) {
  const [entries, setEntries] = useState([])
  const [tab, setTab] = useState('Entries');
  const [cacheTabs, setCacheTabs] = useState({})
  let history = useHistory()
  let match = useRouteMatch()

  const fetchEntries = async () => {
    const res = await fetch_('entries', 'GET')
    setEntries(res.entries)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const clickTab = (k) => {
    setCacheTabs({...cacheTabs, [k]: true})
    setTab(k)
  }

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
      <Button
        style={{float: 'right'}}
        variant="success"
        size='lg'
        className='bottom-margin'
        onClick={() => gotoForm()}
      >New Entry</Button>

      <Tabs
        variant='pills'
        activeKey={tab}
        onSelect={clickTab}
      >
        <Tab eventKey="Entries" title="Entries">
          <Table>
            <tbody>
              {entries.map(renderEntry)}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="Themes" title="Themes">
          {cacheTabs['Themes'] && <Themes fetch_={fetch_} />}
        </Tab>
        <Tab eventKey="Books" title="Books">
          {cacheTabs['Books'] && <Books fetch_={fetch_} />}
        </Tab>
      </Tabs>
    </div>
  )
}
