import React, {useEffect, useState} from "react";
import {Modal, Table} from "react-bootstrap";
import _ from "lodash";
import ReactMarkdown from "react-markdown";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";
import {spinner} from './utils'

const round_ = (v) => v ? v.toFixed(2) : null

export default function ChartModal({fetch_, close, field=null, overall=false}) {
  const [influencers, setInfluencers] = useState({})
  const [fields, setFields] = useState([])
  const [nextPreds, setNextPreds] = useState({})
  const [enough, setEnough] = useState(false)
  const [fetching, setFetching] = useState(false)

  // console.log('influencers', influencers)

  const fetchFieldPreds = async (fields) => {
    const {data} = await fetch_(`influencers?target=${field.id}`, 'GET')
    if (!data.per_target) {
      return setEnough(false)
    }
    setEnough(true)
    // console.log('data', data)
    setInfluencers(data.per_target[field.id])
    setNextPreds(data.next_preds)
  }

  const fetchOverallPreds = async (fields) => {
    const {data} = await fetch_(`influencers`, 'GET')
    if (!data.overall) {
      return setEnough(false)
    }
    setEnough(true)
    setInfluencers(data.overall)
    setNextPreds(data.next_preds)
  }

  const fetchTargets = async () => {
    setFetching(true)
    const {data} = await fetch_('fields', 'GET')
    setFields(data)
    await (overall ? fetchOverallPreds : fetchFieldPreds)(data)
    setFetching(false)
  }

  useEffect(() => {
    fetchTargets()
  }, [])

  const renderInfluencers = () => {
    if (!enough) {
      return <p>
        After you have enough field entries, this feature will show you which fields influence which other fields.
      </p>
    }
    return <>
      <Table striped size="sm">
        <thead>
        <tr>
          <th>Field</th>
          <th>Importance</th>
          <th>Avg</th>
          <th>Predicted Next</th>
        </tr>
        </thead>
        <tbody>
        {fetching ? spinner : _(influencers)
          .toPairs()
          .filter(x => x[1] > 0)
          .orderBy(x => -x[1])
          .value()
          .map(x => <tr key={x[0]}>
            <td><ReactMarkdown source={fields[x[0]].name} /></td>
            <td>{ round_(x[1]) }</td>
            <td>{ round_(fields[x[0]].avg) }</td>
            <td>{ round_(nextPreds[x[0]]) }</td>
          </tr>)}
        </tbody>
      </Table>
    </>
  }

  const renderBody = () => {
    return <>
      {field && (
        <LineChart width={730} height={250} data={field.history}>
          {/*margin={{ top: 5, right: 30, left: 20, bottom: 5 }}*/}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="created_at" />
          <YAxis />
          <Tooltip />
          {/*<Legend />*/}
          <Line type="monotone" dataKey="value" stroke="#8884d8" isAnimationActive={false}/>
        </LineChart>
      )}
      {field && <div>
        <h5>Stats</h5>
        <ul>
          <li>
            Predicted Next Value:{' '}
            {enough ? round_(nextPreds[field.id]) : "<feature available after more field entries>"}
          </li>
          <li>Average/day: {round_(field.avg)}</li>
        </ul>
      </div>}
      {field && field.target && <div>
        <h5>Top Influencers</h5>
        {renderInfluencers()}
      </div>}
      {overall && renderInfluencers()}
    </>
  }

  return (
    <Modal size="lg" show={true} onHide={close} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>{field ? field.name : "Top Influencers"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderBody()}
      </Modal.Body>
    </Modal>
  );
}
