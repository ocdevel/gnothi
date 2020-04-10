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


function ChartModal({field, onClose}) {
  return (
    <>
      <Modal size="lg" show={true} onHide={onClose} animation={false}>
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
        </Modal.Body>
      </Modal>
    </>
  );
}

function Habitica({jwt}) {
  const [habiticaUserId, setHabiticaUserId] = useState('')
  const [habiticaApiToken, setHabiticaApiToken] = useState('')

  const fetchUser = async () => {
    const res = await fetch_(`user`, 'GET', null, jwt)
    setHabiticaUserId(res.habitica_user_id)
    setHabiticaApiToken(res.habitica_api_token)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const saveHabitica = async e => {
    e.preventDefault()
    const body = {
      habitica_user_id: habiticaUserId,
      habitica_api_token: habiticaApiToken
    }
    await fetch_(`habitica`, 'POST', body, jwt)
    fetchUser()
  }

  const changeHabiticaUserId = e => setHabiticaUserId(e.target.value)
  const changeHabiticaApiToken = e => setHabiticaApiToken(e.target.value)

  return (
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
}

export default function Fields({jwt}) {
  const [fields, setFields] = useState([])
  const [showChart, setShowChart] = useState(null)

  const DEFAULT_TYPE = 'number'
  const DEFAULT_DEFAULT = 'value'
  const [showForm, setShowForm] = useState(false) // true, false, fid
  const [fieldName, setFieldName] = useState("")
  const [fieldType, setFieldType] = useState(DEFAULT_TYPE)
  const [fieldDefault, setFieldDefault] = useState(DEFAULT_DEFAULT)
  const [fieldDefaultValue, setFieldDefaultValue] = useState("")
  const [fieldTarget, setFieldTarget] = useState(false)

  const fid = show2fid(showForm)
  const f_map = _.transform(fields, (m,v,k) => {
    m[v.id] = v
  }, {})
  const field = f_map[fid]

  const fetchFields = async () => {
    const res = await fetch_(`fields`, 'GET', null, jwt)
    setFields(res.fields)
    _.each(res.fields, f => {
      _.each(f.history, (h, i) => {f.history[i].created_at = moment(h.created_at).format("YYYY-MM-DD")})
    })
  }

  useEffect(() => {
    fetchFields()
  }, [])

  const saveField = async e => {
    // e.preventDefault()
    const body = {
      name: fieldName,
      type: fieldType,
      default_value: fieldDefault,
      default_value_value: _.isEmpty(fieldDefaultValue) ? null : fieldDefaultValue
    }
    if (fid) {
      await fetch_(`fields/${fid}`, 'PUT', body, jwt)
    } else {
      await fetch_(`fields`, 'POST', body, jwt)
    }

    await fetchFields()
    doShowForm(false)
  }

  const changeFieldName = e => setFieldName(e.target.value)
  const changeFieldType = e => setFieldType(e.target.value)
  const changeFieldDefault = e => setFieldDefault(e.target.value)
  const changeFieldDefaultValue = e => setFieldDefaultValue(e.target.value)
  const changeFieldTarget = e => setFieldTarget(e.target.value)

  const doShowForm = (show_or_id) => {
    setShowForm(show_or_id)
    const fid = show2fid(show_or_id)
    const [name, type, default_value, default_value_value, target] =
      fid ? [f_map[fid].name, f_map[fid].type, f_map[fid].default_value, f_map[fid].default_value_value, f_map[fid].target]
      : ["", DEFAULT_TYPE, DEFAULT_DEFAULT, "", false]
    setFieldName(name)
    setFieldType(type)
    setFieldDefault(default_value)
    setFieldDefaultValue(default_value_value)
    setFieldTarget(target)
  }

  const destroyField = async () => {
    if (!window.confirm("Are you sure? This will delete all data for this field.")) {
      return
    }
    await fetch_(`fields/${fid}`, 'DELETE', null, jwt)
    setShowForm(false)
    fetchFields()
  }
  const excludeField = async (exclude=true) => {
    const body = {excluded_at: exclude ? new Date() : null}
    await fetch_(`fields/${fid}`, 'PUT', body, jwt)
    setShowForm(false)
    fetchFields()
  }

  let defValHelp = {
    value: `Auto-populate this field with "Default Value". Leaving it empty is valid (blanks are considered by ML models)`,
    ffill: `Pulls the value from your last entry for this field`,
    average: `Uses your average accross entries for this field`
  }
  const lastEntry = fid && _.last(field.history)
  if (lastEntry) { // only show if have values to work with
    defValHelp.ffill += ` (currently ${lastEntry.value})`
    defValHelp.average += ` (currently ${field.avg})`
  }
  defValHelp = defValHelp[fieldDefault]

  const renderFieldForm = () => (
    <Modal.Dialog style={{margin: 0, marginBottom: 10}}>
      <Modal.Header>
        <Modal.Title>{fid ? "Edit Field" : "New Field"}</Modal.Title>
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
          <Form.Text className="text-muted">
            {defValHelp}
          </Form.Text>
        </Form.Group>

        {fieldDefault === 'value' && (
          <Form.Group controlId="formFieldDefaultValue">
            <Form.Label>Default Value</Form.Label>
            <Form.Control
              type="text"
              value={fieldDefaultValue}
              onChange={changeFieldDefaultValue}
            />
          </Form.Group>
        )}

        <Form.Group controlId="formFieldTarget">
          <Form.Check
            type="checkbox"
            label="Target"
            value={fieldTarget}
            onChange={changeFieldTarget}
          />
          <Form.Text className="text-muted">
            Use this field as a target variable. Ie, you want to know what causes this field (based on other fields). Eg, if "Mood" is a target, we'll look at what other fields effect mood.
          </Form.Text>
        </Form.Group>

        {fid && (
          <>
            <hr/>
            <div className='bottom-margin'>
              <Button
                disabled={field.service}
                variant='danger'
                onClick={() => destroyField(fid)}
                size='sm'
              >Delete</Button>
              <br/>
              <small
                style={field.service ? {textDecoration: 'line-through'}: {}}
              >
                Permenantly delete this field and all its entries
              </small>
              {field.service && <>
                <br/>
                <small>Delete this field at the source. To exclude from Gnothi, click "Remove".</small>
              </>}

            </div>
            <div>
              {field.excluded_at ? (
                <>
                <Button
                  variant='primary'
                  onClick={() => excludeField(false)}
                  size='sm'
                >Include</Button>
                <br/>
                <small>Bring this field back</small>
                </>
              ) : (
                <>
                <Button
                  variant='danger'
                  onClick={() => excludeField(true)}
                  size='sm'
                >Remove</Button>
                <br/>
                <small>Don't delete this field, but exclude it from showing up starting now.</small>
                </>
              )}
            </div>
          </>
        )}
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
        {_.sortBy(group, 'id').map(f => (
          <Col
            key={f.id}
            className='field-column'
            style={!f.excluded_at ? {} : {
              textDecoration: 'line-through',
              opacity: .5
            }}
          >
            <Form.Row>
              <Col lg={2}>
                <a
                  onClick={() => doShowForm(f.id)}
                  className='cursor-pointer'
                >✏</a>
              </Col>
              <Form.Label column="sm" lg={6}>
                <ReactMarkdown source={f.name} linkTarget='_blank'/>
              </Form.Label>
              <Col lg={4}>
                Avg: {f.avg.toFixed(1)}&nbsp;
                <a
                  onClick={() => setShowChart(f.id)}
                  className='cursor-pointer'
                >📈</a>
              </Col>
            </Form.Row>
          </Col>
        ))}
      </Row>
    </Form.Group>
  )

  const renderFieldGroups = () => {
    const groups = _.transform(fields, (m, v, k) => {
      const svc = v.service || 'Custom';
      (m[svc] || (m[svc] = [])).push(v)
    }, {})
    return (
      <Accordion defaultActiveKey="Custom">
        {_.map(groups, (group, service)=> (
          <Card key={service}>
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
            <Accordion.Toggle as={Button} variant="link" eventKey='setupHabitica'>
              Setup Habitica
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey='setupHabitica'>
            <Card.Body><Habitica jwt={jwt}/></Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    )
  }

  return (
    <>
      {showChart && <ChartModal field={f_map[showChart]} onClose={() => setShowChart(null)}/>}
      {showForm ? renderFieldForm() : (
        <Button
          variant="success"
          onClick={() => doShowForm(true)}
          size="lg"
          className='bottom-margin'
        >New Field</Button>
      )}
      {renderFieldGroups()}
    </>
  )
}
