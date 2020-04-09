import React, {useEffect, useState} from "react";
import {fetch_} from "./utils";
import _ from "lodash";
import moment from "moment";
import {Accordion, Button, Card, Col, Form, Row} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import {LineChart,
CartesianGrid,
XAxis,
YAxis,
Tooltip,
Legend,
Line} from 'recharts'

export default function Fields({jwt}) {
  const [fields, setFields] = useState([])
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState('number')
  const [showCharts, setShowCharts] = useState({})

  const fetchFields = async () => {
    const res = await fetch_(`fields`, 'GET', null, jwt)
    setFields(res.fields)
    _.each(res.fields, f => {
      _.each(f.history, (h, i) => {f.history[i].created_at = moment(h.created_at).format("YYYY-MM-DD")})
    })
  }

  useEffect(() => {fetchFields()}, [])

  const createField = async e => {
    // e.preventDefault()
    const body = {name: fieldName, type: fieldType}
    await fetch_(`fields`, 'POST', body, jwt)
    await fetchFields()
    fetchFields()
  }


  const changeFieldName = e => setFieldName(e.target.value)
  const changeFieldType = e => setFieldType(e.target.value)
  const showChart = fid => {
    setShowCharts({...showCharts, [fid]: !showCharts[fid]})
  }

  const renderFields = (group, service) => (
    <Form.Group controlId={`formFieldsFields`}>
      <Row sm={4}>
        {group.map(f => (
          <Col className='field-column'>
            <Form.Row>
              <Form.Label column="sm" lg={6}>
                <ReactMarkdown source={f.name} linkTarget='_blank' />
              </Form.Label>
              <Col lg={6}>Avg: {f.avg.toFixed(1)} <span onClick={() => showChart(f.id)}>📈</span></Col>
            </Form.Row>
            {showCharts[f.id] && (
              <LineChart width={730} height={250} data={f.history}>
                {/*margin={{ top: 5, right: 30, left: 20, bottom: 5 }}*/}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="created_at" />
                <YAxis />
                <Tooltip />
                {/*<Legend />*/}
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            )}
          </Col>
        ))}
      </Row>
    </Form.Group>
  )

  const renderNewField = () => (
    <div>
      <Form.Group controlId="formFieldName">
        <Form.Label>Field Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Name"
          value={fieldName}
          onChange={changeFieldName}
        />
      </Form.Group>

      <Form.Group controlId="formFieldType">
        <Form.Label>Field Type</Form.Label>
        <Form.Control
          as="select"
          value={fieldType}
          onChange={changeFieldType}
        >
          <option>number</option>
          <option>fivestar</option>
        </Form.Control>
      </Form.Group>

      <Button variant="primary" onClick={createField}>
        Submit
      </Button>
    </div>
  )


  const renderFieldGroups = () => {
    const groups = _.transform(fields, (m, v, k) => {
      const svc = v.service || 'Custom';
      (m[svc] || (m[svc] = [])).push(v)
    }, {})
    return (
      <Accordion defaultActiveKey="Custom">
        {_.map(groups, (group, service)=> (
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} variant="link" eventKey={service}>
                {service}
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey={service}>
              <Card.Body>{renderFields(group, service)}</Card.Body>
            </Accordion.Collapse>
          </Card>
        ))}
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey='more'>
              More
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey='more'>
            <Card.Body>
              {renderNewField()}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    )
  }

  return renderFieldGroups()
}
