import React, {useEffect, useState} from "react";
import {fetch_} from "./utils";
import {Modal, Table} from "react-bootstrap";
import _ from "lodash";
import ReactMarkdown from "react-markdown";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";

export default function ChartModal({jwt, field, close}) {
  const [influencers, setInfluencers] = useState({})
  const [fields, setFields] = useState([])

  const target = field.id

  const fetchTargets = async () => {
    let res = await fetch_('fields', 'GET', null, jwt)
    setFields(res)
    res = await fetch_(`influencers?target=${target}`, 'GET', null, jwt)
    setInfluencers(res[target])
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
          <Modal.Title>{field.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LineChart width={730} height={250} data={field.history}>
            {/*margin={{ top: 5, right: 30, left: 20, bottom: 5 }}*/}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="created_at" />
            <YAxis />
            <Tooltip />
            {/*<Legend />*/}
            <Line type="monotone" dataKey="value" stroke="#8884d8" isAnimationActive={false}/>
          </LineChart>
          {field.target && <>
            <h2>Top Influencers</h2>
            {renderInfluencers()}
          </>}
        </Modal.Body>
      </Modal>
    </>
  );
}
