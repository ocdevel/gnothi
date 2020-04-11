import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState} from "react"
import {fetch_} from "./utils"
import _ from "lodash"
import {
  Accordion,
  Button,
  Card,
  Col,
  Form,
  Row,
  Alert,
  Spinner,
  Table
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import ReactStars from "react-stars"
import './Entry.css'

const spinner = (
  <Spinner animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
)

function Fields(props) {
  const {
    jwt,
    entry_id,
    fetchEntry,
    fields,
    setFields,
    fieldVals,
    setFieldVals
  } = props

  const [fetchingSvc, setFetchingSvc] = useState(false)

  const fetchFields = async () => {
    const res = await fetch_(`fields`, 'GET', null, jwt)
    setFields(res.fields)
    if (entry_id) {
      // fieldVals will be set by the entry json response (Entry)
      return
    }
    // set fieldVals based on f.default_value. FIXME do this server-side!
    const fieldVals_ = _.transform(res.fields, (m, v, k) => {
      const recent = _.last(v.history)
      m[v.id] = {
        value: v.default_value_value,
        ffill: recent ? recent.value : null,
        average: v.avg
      }[v.default_value]
    }, {})
    setFieldVals(fieldVals_)
  }

  useEffect(() => {fetchFields()}, [entry_id])

  const fetchService = async (service) => {
    setFetchingSvc(true)
    await fetch_(`${service}/${entry_id}`, 'GET', null, jwt)
    await fetchEntry()
    setFetchingSvc(false)
  }

  const changeFieldVal = (k, direct=false) => e => {
    const v = direct ? e : e.target.value
    setFieldVals({...fieldVals, [k]: v})
  }

  const renderSyncButton = (service) => {
    if (service === 'Custom') {return null}
    return <>
      {!entry_id ? <Alert variant='warning'>Save this entry first, then come back to sync (bug)</Alert>
      : fetchingSvc ? spinner
      : <Button onClick={() => fetchService(service)}>Sync {service}</Button>
      }
      <br/>
      <small>Not automatically synced, so be sure to sync before bed each day.</small>
    </>
  }

  const renderFields = (group, service) => (
    <Table size='sm' borderless>
      <tbody>
        {_.sortBy(group, 'id').map(f => (
          <tr key={f.id}>
              <td>
                <ReactMarkdown source={f.name} linkTarget='_blank' />
              </td>
              <td>
                {f.type === 'fivestar' ? (
                  <ReactStars
                    value={fieldVals[f.id]}
                    half={false}
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
              </td>
          </tr>
        ))}
      </tbody>
      {renderSyncButton(service)}
    </Table>
  )

  const renderFieldGroups = () => {
    const groups = _.transform(fields, (m, v, k) => {
      if (v.excluded_at) {return}
      const svc = v.service || 'Custom';
      (m[svc] || (m[svc] = [])).push(v)
    }, {})

    // FIXME how to handle this automatically?
    if (!groups.habitica) {
      groups.habitica = []
    }
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
      </Accordion>
    )
  }

  return renderFieldGroups()
}

export default function Entry({jwt}) {
  const {entry_id} = useParams()
  const history = useHistory()
  const [showPreview, setShowPreview] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [text, setText] = useState('')
  const [fieldVals, setFieldVals] = useState({})
  const [fields, setFields] = useState({})

  const f_map = _.transform(fields, (m, v, k) => {
    m[v.id] = v
  }, {})

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
    setSubmitting(true)
    const customVals = _.omitBy(fieldVals, (v,k) => f_map[k].service)
    const body = {title, text, fields: customVals}
    if (entry_id) {
      await fetch_(`entries/${entry_id}`, 'PUT', body, jwt)
    } else {
      await fetch_(`entries`, 'POST', body, jwt)
    }
    setSubmitting(false)
    history.push('/j')
  }

  const changeTitle = e => setTitle(e.target.value)
  const changeText = e => setText(e.target.value)
  const changeShowPreview = e => setShowPreview(e.target.checked)

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
        <Form.Text>
          Leave blank to use a machine-generated title based on your entry.
        </Form.Text>
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
        {showPreview && (
          <Col className='markdown-render'>
            <ReactMarkdown source={text} linkTarget='_blank' />
          </Col>
        )}
      </Row>

      <Form.Group controlId="formShowPreview">
        <Form.Check
          type="checkbox"
          label="Show Preview"
          checked={showPreview}
          onChange={changeShowPreview}
        />
      </Form.Group>

      <hr />
      <Fields
        jwt={jwt}
        fetchEntry={fetchEntry}
        entry_id={entry_id}
        fields={fields}
        setFields={setFields}
        fieldVals={fieldVals}
        setFieldVals={setFieldVals}
      />
      <hr />

      {submitting ? (
        <>
        {spinner}
        <p className='text-muted'>Generating summaries & sentiment</p>
        </>
      ) : (
        <>
        <Button
          variant="primary"
          type="submit"
        >
          Submit
        </Button>&nbsp;
        <Button variant='secondary' size="sm" onClick={cancel}>
          Cancel
        </Button>
        </>
      )}
    </Form>
  )
}
