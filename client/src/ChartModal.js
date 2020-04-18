import React, {useEffect, useState} from "react";
import {Modal, Table} from "react-bootstrap";
import _ from "lodash";
import ReactMarkdown from "react-markdown";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";

export default function ChartModal({fetch_, close, field=null, overall=false}) {
  const [influencers, setInfluencers] = useState({})
  const [fields, setFields] = useState([])

  const fetchTargets = async () => {
    let res = await fetch_('fields', 'GET')
    setFields(res.data)
    if (overall) {
      res = await fetch_(`influencers`, 'GET')
      setInfluencers(res.data.overall)
    } else {
      res = await fetch_(`influencers?target=${field.id}`, 'GET')
      setInfluencers(res.data.per_target[field.id])
    }
  }

  useEffect(() => {
    fetchTargets()
  }, [])

  const renderInfluencers = () => <>
    <Table striped size="sm">
      <thead>
        <tr>
          <th>Importance</th>
          <th>Field</th>
        </tr>
      </thead>
      <tbody>
        {_(influencers)
          .toPairs()
          .filter(x => x[1] > 0)
          .orderBy(x => -x[1])
          .value()
          .map(x => <tr key={x[0]}>
            <td>{x[1]}</td>
            <td><ReactMarkdown source={fields[x[0]].name} /></td>
          </tr>)}
      </tbody>
    </Table>
  </>

  return (
    <>
      <Modal size="lg" show={true} onHide={close} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>{field ? field.name : "Top Influencers"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
          {field && field.target && <>
            <h2>Top Influencers</h2>
            {renderInfluencers()}
          </>}
          {overall && renderInfluencers()}
        </Modal.Body>
      </Modal>
    </>
  );
}
