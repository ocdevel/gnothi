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
      <Button variant="primary" size='lg' onClick={() => gotoForm()}>New Entry</Button>
      <hr/>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr>
              <td>{moment(e.created_at).format('YYYY-MM-DD h:mm a')}</td>
              <td>{e.title}</td>
              <td>
                <Button size='sm' onClick={() => gotoForm(e.id)}>Edit</Button>&nbsp;
                <Button variant='danger' size='sm' onClick={() => deleteEntry(e)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Fields jwt={jwt}/>
    </div>
  )
}
