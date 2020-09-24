import React, {useEffect, useState} from "react"
import {sent2face, spinner, trueKeys} from "../utils"
import {Button, Card, Form} from "react-bootstrap"
import _ from "lodash"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'

export default function Themes() {
  const [themes, setThemes] = useState({})
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)
  const days = useSelector(state => state.days)

  const dispatch = useDispatch()

  const fetchThemes = async () => {
    setFetching(true)
    const tags_ = trueKeys(selectedTags)
    const body = {days}
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

  return <>
    <Form onSubmit={_.noop}>

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
    </>}
    </Form>
    {_.size(themes) > 0 && renderThemes()}
  </>
}
