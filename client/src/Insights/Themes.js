import React, {useEffect, useState} from "react"
import {sent2face} from "../utils"
import {Spinner} from "./utils"
import {Button, Form} from "react-bootstrap"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import {useStoreState, useStoreActions} from 'easy-peasy'

export default function Themes() {
  const [advanced, setAdvanced] = useState(false)
  const aiStatus = useStoreState(state => state.server.ai)
  const insight = useStoreState(state => state.insights.themes)
  const setInsight = useStoreActions(actions => actions.insights.setInsight)
  const getInsight = useStoreActions(actions => actions.insights.getInsight)

  const {req, res1, res2, fetching} = insight
  const {code, message, data} = res2

  const fetchThemes = async () => {
    getInsight('themes')
  }

  if (code === 401) { return <h5>{message}</h5> }

  const renderTerms = terms => {
    if (!terms) {return null}
    return terms.map((t, i) => <>
      <code>{t}</code>
      {i < terms.length - 1 ? ' · ' : ''}
    </>)
  }

  const renderThemes = () => {
    const themes_ =_.sortBy(data.themes, 'n_entries').slice().reverse()
    return <>
      <div className='mb-3'>
        <h5>Top terms</h5>
        <p>{renderTerms(data.terms)}</p>
        <hr/>
      </div>
      {themes_.map((t, i) => (
        <div key={`${i}-${t.length}`} className='mb-3'>
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
    const algos = [{
      k: 'kmeans',
      label: 'KMeans',
      url: "https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html"
    }, {
      k: 'agglomorative',
      label: 'Agglomorative',
      url: "https://scikit-learn.org/stable/modules/generated/sklearn.cluster.AgglomerativeClustering.html",
    }]

    return <div className='mb-3'>
      <div>
        <span
          className='cursor-pointer'
          onClick={() => setAdvanced(!advanced)}
        ><BsGear /> Advanced</span>
      </div>
      {advanced && <div>
        <hr />
        <Form.Label>Clustering Algorithm</Form.Label>
        {algos.map(a => (
          <Form.Check
            type='radio'
            label={<span>
              {a.label} <a href={a.url} target='_blank'><BsQuestionCircle /></a>
            </span>}
            id={`algo-${a.k}`}
            checked={req === a.k}
            onChange={() => setInsight(['themes', {req: a.k}])}
          />
        ))}
        <Form.Text>If the output seems off, try a different clustering algorithm. Don't worry about the tech (unless you're curious), just click the other one and submit.</Form.Text>
        <hr />
      </div>}
    </div>
  }

  return <>
    {fetching ? <Spinner job={res1} /> : <>
      {renderAdvanced()}
      <Button
        disabled={aiStatus !== 'on'}
        className='mb-3'
        variant='primary'
        onClick={fetchThemes}
      >Show Themes</Button>
    </>}
    {data && renderThemes()}
  </>
}
