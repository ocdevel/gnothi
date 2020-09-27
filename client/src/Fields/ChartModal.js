import React, {useEffect, useState} from "react";
import {Modal, Table} from "react-bootstrap";
import _ from "lodash";
import ReactMarkdown from "react-markdown";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";

import { fetch_ } from '../redux/actions'
import { useSelector, useDispatch } from 'react-redux'

const round_ = (v) => v ? v.toFixed(2) : null

export default function ChartModal({close, field=null, overall=false}) {
  const [history, setHistory] = useState([])
  const fields = useSelector(state => state.fields)
  const influencers = useSelector(state => state.influencers)
  const dispatch = useDispatch()

  const getHistory = async () => {
    if (!field) { return }
    const {data, code, message} = await dispatch(fetch_(`fields/${field.id}/history`))
    setHistory(data || [])
  }

  useEffect(() => {
    getHistory()
  }, [field])

  let influencers_ = _.isEmpty(influencers) ? false
    : field ? influencers[field.id]
    : _.reduce(fields, (m,v,k) => {
        m[k] = v.influencer_score
        return m
      }, {})

  const renderInfluencers = () => {
    if (!influencers_) {
      return <p>
        After you've logged enough field entries, this feature will show you which fields influence this field. If you're expecting results now, make sure you set fields as <strong>target</strong> (edit the field), then wait an hour or two. Influencers only calculate for target fields.
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
        {_(influencers_)
          .toPairs()
          .filter(x => x[1] > 0)
          .orderBy(x => -x[1])
          .value()
          .map(x => <tr key={x[0]}>
            <td><ReactMarkdown source={fields[x[0]].name} /></td>
            <td>{ round_(x[1]) }</td>
            <td>{ round_(fields[x[0]].avg) }</td>
            <td>{ round_(fields[x[0]].next_pred) }</td>
          </tr>)}
        </tbody>
      </Table>
    </>
  }

  const renderBody = () => {
    return <>
      {history.length > 0 && (
        <LineChart width={730} height={250} data={history}>
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
            {field.next_pred ? round_(field.next_pred) : "<feature available after more field entries>"}
          </li>
          <li>Average/day: {round_(field.avg)}</li>
        </ul>
      </div>}
      {field && <div>
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
