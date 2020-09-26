import React, {useEffect, useState} from "react"
import {sent2face, spinner, trueKeys} from "../utils"
import {Button, Card, Form, Badge} from "react-bootstrap"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import { useSelector, useDispatch } from 'react-redux'
import { fetch_ } from '../redux/actions'

export default function Themes() {
  const [themes, setThemes] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [algo, setAlgo] = useState('agglomorative')
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const aiStatus = useSelector(state => state.aiStatus)
  const selectedTags = useSelector(state => state.selectedTags)
  const days = useSelector(state => state.days)

  const dispatch = useDispatch()

  const fetchThemes = async () => {
    setFetching(true)
    const tags_ = trueKeys(selectedTags)
    const body = {days, algo}
    if (tags_.length) { body.tags = tags_}
    const {data, code, message} = await dispatch(fetch_('themes', 'POST', body))
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setThemes(data)
  }

  if (notShared) {return <h5>{notShared}</h5>}

  const renderTerms = terms => terms.map((t, i) => <>
    <code>{t}</code>
    {i < terms.length - 1 ? ' · ' : ''}
  </>)

  const renderThemes = () => {
    const themes_ =_.sortBy(themes.themes, 'n_entries').slice().reverse()
    return <>
      <div className='bottom-margin'>
        <h5>Top terms</h5>
        <p>{renderTerms(themes.terms)}</p>
        <hr/>
      </div>
      {themes_.map((t, i) => (
        <div key={`${i}-${t.length}`} className='bottom-margin'>
          <h5>{sent2face(t.sentiment)} {t.n_entries} Entries</h5>
          <p>
            {renderTerms(t.terms)}
            {t.summary && <p><b>Summary</b>: {t.summary}</p>}
          </p>
          <hr />
        </div>
      ))}
      <p>Does the output seem off? Try <BsGear /> Advanced.</p>
    </>
  }

  const renderAdvanced = () => {
    const aggLabel = <span>
      Agglomorative{' '}
      <a href="https://scikit-learn.org/stable/modules/generated/sklearn.cluster.AgglomerativeClustering.html" target='_blank'><BsQuestionCircle /></a>
    </span>
    const kmeansLabel = <span>
      KMeans{' '}
      <a href="https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html" target="_blank"><BsQuestionCircle /></a>
    </span>

    return <div className='bottom-margin'>
      <div>
        <span
          className='cursor-pointer'
          onClick={() => setAdvanced(!advanced)}
        ><BsGear /> Advanced</span>
      </div>
      {advanced && <div>
        <hr />
        <Form.Label>Clustering Algorithm</Form.Label>
        <Form.Check
          type='radio'
          label={aggLabel}
          id='algo-agglomorative'
          checked={algo === 'agglomorative'}
          onChange={() => setAlgo('agglomorative')}
        />
        <Form.Check
          type='radio'
          label={kmeansLabel}
          id='algo-kmeans'
          checked={algo === 'kmeans'}
          onChange={() => setAlgo('kmeans')}
        />
        <Form.Text>If the output seems off, try a different clustering algorithm. Don't worry about the tech (unless you're curious), just click the other one and submit.</Form.Text>
        <hr />
      </div>}
    </div>
  }

  return <>
    {fetching ? <>
      <div>{spinner}</div>
      <Form.Text muted>Takes a long time. Will fix later.</Form.Text>
    </> : <>
      {renderAdvanced()}
      <Button
        disabled={aiStatus !== 'on'}
        className='bottom-margin'
        variant='primary'
        onClick={fetchThemes}
      >Show Themes</Button>
    </>}
    {_.size(themes) > 0 && renderThemes()}
  </>
}
