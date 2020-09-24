import React, {useEffect, useState} from "react"
import {AiStatusMsg, sent2face, spinner, trueKeys, toolAlert} from "./utils"
import {Button, Card, Form} from "react-bootstrap"
import _ from "lodash"
import ForXDays from "./ForXDays"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from './redux/actions'

export default function Themes() {
  const [themes, setThemes] = useState({})
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [form, setForm] = useState({days: 200})
  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)

  const dispatch = useDispatch()

  const fetchThemes = async () => {
    setFetching(true)
    const tags_ = trueKeys(selectedTags)
    const body = {...form}
    if (tags_.length) { body.tags = tags_}
    const {data, code, message} = await dispatch(fetch_('themes', 'POST', body))
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setThemes(data)
  }

  if (notShared) {return <h5>{notShared}</h5>}

  const renderThemes = () => {
    const themes_ =_.sortBy(themes.themes, 'n_entries').slice().reverse()
    return <>
      <hr/>
      <Card className='bottom-margin'>
        <Card.Body>
          <Card.Title>Top terms</Card.Title>
          <Card.Text>{themes.terms.join(', ')}</Card.Text>
        </Card.Body>
      </Card>
      {themes_.map((t, i) => (
        <Card key={`${i}-${t.length}`} className='bottom-margin'>
          <Card.Body>
            <Card.Title>{t.n_entries} Entries</Card.Title>
            <Card.Text>
              {sent2face(t.sentiment)}
              {t.terms.join(', ')}
              {t.summary && <p><hr/><b>Summary</b>: {t.summary}</p>}
            </Card.Text>
          </Card.Body>
        </Card>
      ))}
    </>
  }

  return <div style={{marginTop: 5}}>
    {toolAlert('themes')}
    <Form onSubmit={_.noop}>
    <ForXDays
      form={form}
      setForm={setForm}
      feature={'themes'}
    />

    {fetching ? <>
      <div>{spinner}</div>
      <Form.Text muted>Takes a long time. Will fix later.</Form.Text>
    </> : <>
      <Button
        disabled={aiStatus !== 'on'}
        className='bottom-margin'
        variant='primary'
        onClick={fetchThemes}
      >Show Themes</Button>
      <AiStatusMsg status={aiStatus} />
    </>}
    </Form>
    {_.size(themes) > 0 && renderThemes()}
  </div>
}
