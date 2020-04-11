import React, {useEffect, useState} from "react"
import {useHistory, useRouteMatch} from "react-router-dom"
import {fetch_} from "./utils"
import {
  Button,
  Table,
  Popover,
  OverlayTrigger
} from "react-bootstrap"
import moment from "moment"

const sentimentTip = (
  <Popover>
    <Popover.Content>
      Sentiment is machine-generated from your entry's text
    </Popover.Content>
  </Popover>
);

const summaryTip = (
  <Popover>
    <Popover.Content>
      Summary is machine-generated from your entry's text
    </Popover.Content>
  </Popover>
);

export default function Entries({jwt}) {
  const [entries, setEntries] = useState([])
  let history = useHistory()
  let match = useRouteMatch()

  const fetchEntries = async () => {
    const res = await fetch_('entries', 'GET', null, jwt)
    setEntries(res.entries)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const gotoForm = (entry_id=null) => {
    const p = match.url + "/" + (entry_id ? `entry/${entry_id}` : 'entry')
    history.push(p)
  }

  const deleteEntry = async entry => {
    if (window.confirm(`Delete "${entry.title}?"`)) {
      await fetch_(`entries/${entry.id}`, 'DELETE', null, jwt)
      fetchEntries()
    }
  }

  const renderEntry = e => {
    const style = {}
    let sentiment = null
    if (e.sentiment) {
      style.backgroundColor = {
        POSITIVE: '#24cc8f',
        NEGATIVE: '#ff6165',
      }[e.sentiment]
      style.padding = 5
      style.marginRight = 5
      sentiment = (
        <OverlayTrigger
          trigger="hover"
          placement="right"
          overlay={sentimentTip}
        >
          <span>{{POSITIVE: '🙂', NEGATIVE: '🙁'}[e.sentiment]}</span>
        </OverlayTrigger>
      )
    }
    const textSummary = <span>{e.text_summary}</span>
    return (
      <tr
        key={e.id}
        className='cursor-pointer'
        onClick={() => gotoForm(e.id)}
      >
        <td>
          <h5>{moment(e.created_at).format('MM/DD/YYYY ha')}</h5>
          <h6>{e.title || e.title_summary}</h6>
          <p>
            <span style={style}>{sentiment}</span>
            {e.text_summary === e.text ? textSummary : (
              <OverlayTrigger overlay={summaryTip} trigger="hover">
                {textSummary}
              </OverlayTrigger>
            )}
          </p>
        </td>
        <td>
          <a className='cursor-pointer' onClick={() => gotoForm(e.id)}>✏</a>&nbsp;
          <a className='cursor-pointer' onClick={() => deleteEntry(e)}>⛔</a>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <Button
        variant="success"
        size='lg'
        className='bottom-margin'
        onClick={() => gotoForm()}
      >New Entry</Button>
      <Table>
        <tbody>
          {entries.map(renderEntry)}
        </tbody>
      </Table>
    </div>
  )
}
