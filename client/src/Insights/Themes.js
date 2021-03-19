import React, {useEffect, useState} from "react"
import {sent2face} from "../utils"
import {Spinner} from "./utils"
import {Button, Form} from "react-bootstrap"
import _ from "lodash"
import {BsGear, BsQuestionCircle} from "react-icons/bs"

import {useStoreState, useStoreActions} from 'easy-peasy'

export default function Themes() {
  const [advanced, setAdvanced] = useState(false)
  const emit = useStoreActions(a => a.ws.emit)
  const aiStatus = useStoreState(s => s.ws.data['jobs/status'].status)
  const days = useStoreState(s => s.insights.days)
  const res = useStoreState(s => s.ws.res['insights/themes/post'])
  const job = useStoreState(s => s.ws.data['insights/themes/post'])
  const form = useStoreState(s => s.insights.themes)
  const reply = useStoreState(s => s.ws.data['insights/themes/get'])
  const a = useStoreActions(a => a.insights)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (res) {setWaiting(true)}
  }, [res])
  useEffect(() => {
    if (reply) {setWaiting(false)}
  }, [reply])

  if (res?.code === 401) { return <h5>{res.detail}</h5> }

  function submit(e) {
    e.preventDefault()
    a.postInsight('themes')
  }

  const renderTerms = terms => {
    if (!terms) {return null}
    return terms.map((t, i) => <>
      <code>{t}</code>
      {i < terms.length - 1 ? ' · ' : ''}
    </>)
  }

  const renderThemes = () => {
    const themes_ =_.sortBy(reply.themes, 'n_entries').slice().reverse()
    if (!themes_.length) {
      return <p>No patterns found in your entries yet, come back later</p>
    }
    return <>
      <div className='mb-3'>
        <h5>Top terms</h5>
        <p>{renderTerms(reply.terms)}</p>
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
            checked={form === a.k}
            onChange={() => a.setInsight(['themes', a.k])}
          />
        ))}
        <Form.Text>If the output seems off, try a different clustering algorithm. Don't worry about the tech (unless you're curious), just click the other one and submit.</Form.Text>
        <hr />
      </div>}
    </div>
  }

  return <>
    {waiting ? <Spinner job={job} /> : <>
      {renderAdvanced()}
      <Button
        disabled={aiStatus !== 'on'}
        className='mb-3'
        variant='primary'
        onClick={submit}
      >Show Themes</Button>
    </>}
    {reply && renderThemes()}
  </>
}
