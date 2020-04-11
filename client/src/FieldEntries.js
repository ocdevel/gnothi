import React, {useEffect, useState} from "react";
import {fetch_, spinner} from "./utils";
import _ from "lodash";
import {Accordion, Alert, Button, Card, Form, Table} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import ReactStars from "react-stars";

export default function FieldEntries({jwt}) {
  const [fetchingSvc, setFetchingSvc] = useState(false)
  const [fields, setFields] = useState({})
  const [fieldEntries, setFieldEntries] = useState({})

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
    const v = direct ? e : e.target.value
    setFieldEntries({...fieldEntries, [fid]: v})
    const body = {value: v}
    fetch_(`field-entries/${fid}`, 'POST', body, jwt)
  }

  const renderSyncButton = (service) => {
    if (service === 'Custom') {return null}
    if (fetchingSvc) {return spinner}
    return <>
      <Button onClick={() => fetchService(service)}>Sync {service}</Button>
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
                    value={fieldEntries[f.id]}
                    half={false}
                    size={25}
                    onChange={changeFieldVal(f.id, true)}
                  />
                ) : (
                  <Form.Control
                    disabled={!!f.service}
                    type='text'
                    size="sm"
                    value={fieldEntries[f.id]}
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
