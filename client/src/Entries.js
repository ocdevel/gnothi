import React, {useEffect, useState} from "react"
import {useHistory, useRouteMatch} from "react-router-dom"
import {fetch_} from "./utils"
import {Button, Table} from "react-bootstrap"
import moment from "moment"
import Fields from './Fields'

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

  return (
    <div>
      <Button
        variant="success"
        size='lg'
        className='bottom-margin'
        onClick={() => gotoForm()}
      >New Entry</Button>
      <Table>
        <thead>
          <tr>
            <th></th>
            <th>Date</th>
            <th>Sentiment</th>
            <th>Entry</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td>
                <a className='cursor-pointer' onClick={() => gotoForm(e.id)}>✏</a>&nbsp;
                <a className='cursor-pointer' onClick={() => deleteEntry(e)}>⛔</a>
              </td>
              <td>{moment(e.created_at).format('YYYY-MM-DD ha')}</td>
              <td
                style={{
                  backgroundColor: {
                    POSITIVE: '#24cc8f',
                    NEGATIVE: '#ff6165',
                    undefined: 'default'
                  }[e.sentiment]
                }}
              >
                {{
                  POSITIVE: '🙂',
                  NEGATIVE: '🙁',
                  undefined: ''
                }[e.sentiment]}
              </td>
              <td>
                <h5>{e.title || e.title_summary}</h5>
                <p>{e.text_summary}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
