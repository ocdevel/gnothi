import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState} from "react"
import {fetch_} from "./utils"
import _ from "lodash"
import {Accordion, Button, Card, Col, Form, Row} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import ReactStars from "react-stars"
import './Entry.css'
import {LineChart,
CartesianGrid,
XAxis,
YAxis,
Tooltip,
Legend,
Line} from 'recharts'

function Fields({jwt, fetchEntry, entry_id, fieldVals, setFieldVals}) {
  const [fields, setFields] = useState([])
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState('number')
  const [showCharts, setShowCharts] = useState({})

  const fetchFields = async () => {
    const res = await fetch_(`fields`, 'GET', null, jwt)
    setFields(res.fields)
    setFieldVals(_.zipObject(_.map(res.fields, 'id'))) // => {'a': undefined, 'b': undefined}
  }

  useEffect(() => {fetchFields()}, [])

  const createField = async e => {
    // e.preventDefault()
    const body = {name: fieldName, type: fieldType}
    await fetch_(`fields`, 'POST', body, jwt)
    await fetchFields()
    fetchEntry()
  }

  const fetchService = async (service) => {
    await fetch_(`${service}/${entry_id}`, 'GET', null, jwt)
    fetchEntry()
  }

  const changeFieldVal = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setFieldVals({...fieldVals, [k]: v})
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
              <Form.Label column="sm" lg={3}>
                <ReactMarkdown source={f.name} linkTarget='_blank' />
              </Form.Label>
              <Col lg={6}>
              {f.type === 'fivestar' ? (
                <ReactStars
                  value={fieldVals[f.id]}
                  size={25}
                  onChange={changeFieldVal(f.id, true)}
                />
              ) : (
                <Form.Control
                  disabled={!!f.service}
                  type='text'
                  size="sm"
                  value={fieldVals[f.id]}
                  onChange={changeFieldVal(f.id)}
                />
              )}
              </Col>
              <Col lg={3}>Avg: {f.avg} <span onClick={() => showChart(f.id)}>📈</span></Col>
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
      {
        entry_id &&
        service !== 'Custom' &&
        <Button onClick={() => fetchService(service)}>Sync {service}</Button>
      }
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
      <Accordion>
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
              <hr />
              <Button onClick={() => fetchService('habitica')}>Habitica</Button>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    )
  }

  return renderFieldGroups()
}

export default function Entry({jwt}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [fieldVals, setFieldVals] = useState({})

  const fetchEntry = async () => {
    if (!entry_id) { return }
    const res = await fetch_(`entries/${entry_id}`, 'GET', null, jwt)
    setTitle(res.title)
    setText(res.text)
    setFieldVals(res.fields)
  }

  useEffect(() => {
    fetchEntry()
  }, [entry_id])

  const cancel = () => history.push('/j')

  const submit = async e => {
    e.preventDefault()
    const body = {title, text, fields: fieldVals}
    if (entry_id) {
      await fetch_(`entries/${entry_id}`, 'PUT', body, jwt)
    } else {
      await fetch_(`entries`, 'POST', body, jwt)
    }
    history.push('/j')
  }

  const changeTitle = e => setTitle(e.target.value)
  const changeText = e => setText(e.target.value)

  return (
    <Form onSubmit={submit}>
      <Form.Group controlId="formTitle">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Title"
          value={title}
          onChange={changeTitle}
        />
      </Form.Group>

      <Row>
        <Col>
          <Form.Group controlId="formText">
            <Form.Label>Entry</Form.Label>
            <Form.Control
              as="textarea"
              placeholder="Entry"
              required
              rows={10}
              value={text}
              onChange={changeText}
            />
          </Form.Group>
        </Col>
        <Col className='markdown-render'>
          <ReactMarkdown source={text} linkTarget='_blank' />
        </Col>
      </Row>

      <hr />
      <Fields
        jwt={jwt}
        fetchEntry={fetchEntry}
        entry_id={entry_id}
        fieldVals={fieldVals}
        setFieldVals={setFieldVals}
      />
      <hr />

      <Button variant="primary" type="submit">
        Submit
      </Button>&nbsp;
      <Button variant='secondary' size="sm" onClick={cancel}>
        Cancel
      </Button>
    </Form>
  )
}
