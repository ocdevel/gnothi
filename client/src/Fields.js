import React, {useEffect, useState} from "react";
import {fetch_} from "./utils";
import _ from "lodash";
import moment from "moment";
import {
  Accordion,
  Button,
  Card,
  Col,
  Form,
  Row,
  Modal
} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line
} from 'recharts'

const show2fid = showForm => showForm === true || showForm === false ? null : showForm;

export default function Fields({jwt}) {
  const [fields, setFields] = useState([])
  const [showCharts, setShowCharts] = useState({})

  const [habiticaUserId, setHabiticaUserId] = useState('')
  const [habiticaApiToken, setHabiticaApiToken] = useState('')

  const DEFAULT_NAME = ''
  const DEFAULT_TYPE = 'number'
  const DEFAULT_DEFAULT = 'value'
  const [showForm, setShowForm] = useState(false) // true, false, fid
  const [fieldName, setFieldName] = useState(DEFAULT_NAME)
  const [fieldType, setFieldType] = useState(DEFAULT_TYPE)
  const [fieldDefault, setFieldDefault] = useState(DEFAULT_DEFAULT)

  const fid = show2fid(showForm)
  const f_map = _.transform(fields, (m,v,k) => {
    m[v.id] = v
  }, {})

  const fetchFields = async () => {
    const res = await fetch_(`fields`, 'GET', null, jwt)
    setFields(res.fields)
    _.each(res.fields, f => {
      _.each(f.history, (h, i) => {f.history[i].created_at = moment(h.created_at).format("YYYY-MM-DD")})
    })
  }
  
  const fetchUser = async () => {
    const res = await fetch_(`user`, 'GET', null, jwt)
    setHabiticaUserId(res.habitica_user_id)
    setHabiticaApiToken(res.habitica_api_token)
  }

  useEffect(() => {
    fetchFields()
    fetchUser()
  }, [])

  const saveField = async e => {
    // e.preventDefault()
    const body = {
      name: fieldName,
      type: fieldType,
      default_value: fieldDefault
    }
    if (fid) {
      await fetch_(`fields/${fid}`, 'PUT', body, jwt)
    } else {
      await fetch_(`fields`, 'POST', body, jwt)
    }

    await fetchFields()
    doShowForm(false)
  }

  const saveHabitica = async e => {
    e.preventDefault()
    const body = {
      habitica_user_id: habiticaUserId,
      habitica_api_token: habiticaApiToken
    }
    await fetch_(`habitica`, 'POST', body, jwt)
    fetchUser()
  }

  const changeFieldName = e => setFieldName(e.target.value)
  const changeFieldType = e => setFieldType(e.target.value)
  const changeFieldDefault = e => setFieldDefault(e.target.value)
  const changeHabiticaUserId = e => setHabiticaUserId(e.target.value)
  const changeHabiticaApiToken = e => setHabiticaApiToken(e.target.value)
  const showChart = fid => {
    setShowCharts({...showCharts, [fid]: !showCharts[fid]})
  }

  const doShowForm = (show_or_id) => {
    setShowForm(show_or_id)
    const fid = show2fid(show_or_id)
    const [name, type, default_value] =
      fid ? [f_map[fid].name, f_map[fid].type, f_map[fid].default_value]
      : [DEFAULT_NAME, DEFAULT_TYPE, DEFAULT_DEFAULT]
    setFieldName(name)
    setFieldType(type)
    setFieldDefault(default_value)
  }

  const destroyField = () => {

  }

  const renderFieldForm = (fid=null) => (
    <Modal.Dialog style={{margin: 0, marginBottom: 10}}>
      <Modal.Header>
        <Modal.Title>{fid ? "" : "New Field"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
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

        <Form.Group controlId="formFieldDefault">
          <Form.Label>Field Default</Form.Label>
          <Form.Control
            as="select"
            value={fieldDefault}
            onChange={changeFieldDefault}
          >
            <option value="value">Specific value (including empty)</option>
            <option value="ffill">Pull entry from yesterday</option>
            <option value="average">Average of your entries</option>
          </Form.Control>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => doShowForm(false)}>Cancel</Button>
        <Button variant="primary" onClick={() => saveField(fid)}>Save</Button>
      </Modal.Footer>
    </Modal.Dialog>
  )

  const renderFields = (group, service) => (
    <Form.Group controlId={`formFieldsFields`}>
      <Row sm={4}>
        {group.map(f => (
          <Col className='field-column'>
            <Form.Row>
              <Form.Label column="sm" lg={4}>
                <ReactMarkdown source={f.name} linkTarget='_blank' />
              </Form.Label>
              <Col lg={4}>
                <a onClick={() => doShowForm(f.id)}>✏</a>
                <a onClick={() => destroyField(f.id)}>⛔</a>
              </Col>
              <Col lg={4}>
                Avg: {f.avg.toFixed(1)} <span onClick={() => showChart(f.id)}>📈</span>
              </Col>
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

  const renderSetupHabitica = () => (
    <Form onSubmit={saveHabitica}>
      <Form.Group controlId="formHabiticaUserId">
        <Form.Label>User ID</Form.Label>
        <Form.Control
          type="text"
          value={habiticaUserId}
          onChange={changeHabiticaUserId}
        />
      </Form.Group>

      <Form.Group controlId="formHabiticaApiToken">
        <Form.Label>API Key</Form.Label>
        <Form.Control
          type="text"
          value={habiticaApiToken}
          onChange={changeHabiticaApiToken}
        />
      </Form.Group>
      
      <Button type='submit' variant='success'>
        Save
      </Button>
    </Form>
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
        {!groups.habitica || true && (
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} variant="link" eventKey='setupHabitica'>
                Setup Habitica
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey='setupHabitica'>
              <Card.Body>{renderSetupHabitica()}</Card.Body>
            </Accordion.Collapse>
          </Card>
        )}
      </Accordion>
    )
  }

  return (
    <>
      {showForm ? renderFieldForm() : (
        <Button
          variant="success"
          onClick={() => doShowForm(true)}
          size="lg"
          style={{marginBottom: 10}}
        >New Field</Button>
      )}
      {renderFieldGroups()}
    </>
  )
}
