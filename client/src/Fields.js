import React, {useEffect, useState} from "react";
import {fetch_, spinner} from "./utils";
import _ from "lodash";
import {Accordion, Alert, Button, Card, Form, Table} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import ReactStars from "react-stars";
import SetupHabitica from "./SetupHabitica";
import FieldModal from "./FieldModal";
import ChartModal from "./ChartModal";

export default function Fields({jwt}) {
  const [fetchingSvc, setFetchingSvc] = useState(false)
  const [fields, setFields] = useState({})
  const [fieldEntries, setFieldEntries] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [showChart, setShowChart] = useState(false)

  const fetchFieldEntries = async (fields) => {
    // FIXME shouldn't need to pass in fields, but fields=={} even after fetchFields..
    const res = await fetch_(`field-entries`, 'GET', null, jwt)
    _.each(res, (val, fid) => {
      if (val) {return}
      const f = fields[fid]
      if (f.service) {return}

      // TODO hiding this for now since it will prevent them from clicking, thinking
      // they already have an entry. Reconsider approach
      const recent = _.last(f.history)
      res[fid] = {
        value: f.default_value_value,
        ffill: recent ? recent.value : null,
        average: f.avg
      }[f.default_value]
    })
    setFieldEntries(res)
  }

  const fetchFields = async () => {
    const res = await fetch_(`fields`, 'GET', null, jwt)
    setFields(res)
    await fetchFieldEntries(res)
  }

  useEffect(() => {fetchFields()}, [])

  const fetchService = async (service) => {
    setFetchingSvc(true)
    await fetch_(`${service}/sync`, 'POST', null, jwt)
    await fetchFields()
    setFetchingSvc(false)
  }

  const changeFieldVal = (fid, direct=false) => e => {
    let v = direct ? e : e.target.value
    v = parseFloat(v)  // until we support strings
    setFieldEntries({...fieldEntries, [fid]: v})
    const body = {value: v}
    fetch_(`field-entries/${fid}`, 'POST', body, jwt)
  }

  const changeCheck = fid => e => {
    changeFieldVal(fid, true)(~~!fieldEntries[fid])
  }

  const renderSyncButton = (service) => {
    if (!~['habitica'].indexOf(service)) {return null}
    if (fetchingSvc) {return spinner}
    return <>
      <Button onClick={() => fetchService(service)}>Sync</Button>
    </>
  }

  const onFormClose = () => {
    setShowForm(false)
    fetchFields()
  }

  const onChartClose = () => {
    setShowChart(false)
  }

  const renderField = (f) => {
    return (
      <tr
        key={f.id}
        style={!f.excluded_at ? {} : {
          textDecoration: 'line-through',
          opacity: .5
        }}
      >
        <td
          onClick={() => setShowForm(f.id)}
          className='cursor-pointer'
        >
          <ReactMarkdown source={f.name} linkTarget='_blank' />
        </td>
        <td>
          {f.type === 'fivestar' ? (
            <ReactStars
              value={fieldEntries[f.id]}
              half={false}
              size={25}
              onChange={changeFieldVal(f.id, true)}
            />
          ) : f.type === 'check' ? (
            <>
              <Form.Check
                type='radio'
                label='Yes'
                inline
                checked={fieldEntries[f.id] > 0}
                onChange={changeCheck(f.id)}
              />
              <Form.Check
                type='radio'
                label='No'
                inline
                checked={fieldEntries[f.id] < 1}
                onChange={changeCheck(f.id)}
              />
            </>
          ) : (
            <Form.Control
              disabled={!!f.service}
              type='number'
              size="sm"
              value={fieldEntries[f.id]}
              onChange={changeFieldVal(f.id)}
            />
          )}
        </td>
        <td>
          ~{f.avg && f.avg.toFixed(1)}
          <a
            onClick={() => setShowChart(f.id)}
            className='cursor-pointer'
          >📈</a>
        </td>
      </tr>
    )
  }

  // see 3b92a768 for dynamic field groups. Revisit when more than one service,
  // currently just habitica
  const groups = [{
    service: 'custom',
    name: 'Fields',
    fields: _(fields)
      .filter(v => !v.service && !v.excluded_at)
      .sortBy('id').value()
  }, {
    service: 'habitica',
    name: 'Habitica',
    fields: _(fields)
      .filter(v => v.service === 'habitica' && !v.excluded_at)
      .sortBy('id')
      .value()
  }, {
    service: 'excluded',
    name: 'Excluded',
    fields: _(fields)
      .filter(v => v.excluded_at)
      .sortBy('id')
      .value()
  }]

  return <div>
    {showForm && (
      <FieldModal
        jwt={jwt}
        close={onFormClose}
        field={showForm === true ? {} : fields[showForm]}
      />
    )}

    {showChart && (
      <ChartModal
        jwt={jwt}
        field={showChart === true ? null : fields[showChart]}
        overall={showChart === true}
        close={onChartClose}
      />
    )}

    <Accordion defaultActiveKey="custom">
      {groups.map(g => (
        <Card key={g.service}>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey={g.service}>
              {g.name}
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey={g.service}>
            <Card.Body>
              <Table size='sm' borderless>
                <tbody>
                  {g.fields.map(renderField)}
                </tbody>
                {renderSyncButton(g.service)}
              </Table>
              {g.service === 'custom' && (
                <Button
                  variant="success"
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className='bottom-margin'
                >New Field</Button>
              )}
              {g.service === 'habitica' && <SetupHabitica jwt={jwt}/>}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      ))}
    </Accordion>
    <br/>
    <Button
      variant="outline-primary"
      size="sm"
      onClick={() => setShowChart(true)}
    >Top Influencers</Button>
  </div>
}
