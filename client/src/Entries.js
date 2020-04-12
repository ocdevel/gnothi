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

  const renderEntry = e => {
    const gotoForm_ = () => gotoForm(e.id)
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
          trigger={["hover", "focus"]}
          placement="right"
          overlay={sentimentTip}
        >
          <span>{{POSITIVE: '🙂', NEGATIVE: '🙁'}[e.sentiment]}</span>
        </OverlayTrigger>
      )
    }
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
            <span style={style}>{sentiment}</span>
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
