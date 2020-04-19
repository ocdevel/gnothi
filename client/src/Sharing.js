import {Card, Button, Form, Row, Col} from "react-bootstrap"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import Tags from './Tags'

const feature_map = {
  fields: 'Fields & Charts',
  themes: 'Themes & Books',
  profile: 'Profile & Family'
}

function ShareForm({fetch_, as, fetchShared, share=null}) {
  const [form, setForm] = useState(share ? _.pick(share, ['email', ..._.keys(feature_map)]) : {})
  const [fullTags, setFullTags] = useState(share ? share.full_tags : {})
  const [summaryTags, setSummaryTags] = useState(share ? share.summary_tags : {})

  console.log(form)

  const submit = async e => {
    e.preventDefault()
    const body = {
      ...form,
      full_tags: fullTags,
      summary_tags: summaryTags
    }
    if (share) {
      await fetch_(`shares/${share.id}`, 'PUT', body)
    } else {
      await fetch_('shares', 'POST', body)
      setForm({})
      setFullTags({})
      setSummaryTags({})
    }
    await fetchShared()
  }

  const changeEmail = e => {
    setForm({...form, email: e.target.value})
  }

  const chooseFeature = k => e => {
    const v = e.target.checked
    setForm({...form, [k]: v})
  }

  const unshare = async () => {
    await fetch_(`shares/${share.id}`, 'DELETE')
    fetchShared()
  }

  const ctrlId = 'form' + (share ? share.id : 'new')

  return <div>
    <Form onSubmit={submit}>
      {!share && (
        <Form.Group controlId={`${ctrlId}-email`}>
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            required
            placeholder="Enter email"
            value={form.email}
            onChange={changeEmail}
          />
          <Form.Text className="text-muted">
            Email of person you'll share data with
          </Form.Text>
        </Form.Group>
      )}

      <Form.Group controlId={`${ctrlId}-features`}>
      {_.map(feature_map, (v, k) => (
          <Form.Check
            id={`${ctrlId}-${k}`}
            type="checkbox"
            label={v}
            checked={form[k]}
            onChange={chooseFeature(k)}
          />
      ))}
      </Form.Group>

      <h5>Full Entries</h5>
      <p className='text-muted small'>User will have full read-access to your entries with these tags</p>
      <Tags
        fetch_={fetch_}
        as={as}
        selected={fullTags}
        setSelected={setFullTags}
      />

      <br/><br/>

      <h5>Entries Summaries</h5>
      <p className='text-muted small'>User will have indirect access to entries via<ul>
        <li>Entry summaries</li>
        <li>Multi-day summaries</li>
        <li>Question answering</li>
      </ul></p>
      <Tags
        fetch_={fetch_}
        as={as}
        selected={summaryTags}
        setSelected={setSummaryTags}
      />

      <br />
      <br />

      <Button variant="primary" type="submit">
        {share ? 'Save' : 'Submit'}
      </Button>&nbsp;
      {share && <Button variant="danger" size="sm" onClick={unshare}>Unshare</Button>}
    </Form>
  </div>
}

export default function Sharing({fetch_, as}) {
  const [shared, setShared] = useState([])
  const [notShared, setNotShared] = useState()

  const fetchShared = async () => {
    const {data, code, message} = await fetch_('shares', 'GET')
    if (code === 401) {return setNotShared(message)}
    setShared(data)
  }

  useEffect(() => {fetchShared()}, [as])

  if (notShared) {return <h5>{notShared}</h5>}

  const newForm = <ShareForm
    fetch_={fetch_}
    as={as}
    fetchShared={fetchShared}
  />

  if (_.isEmpty(shared)) {return newForm}

  return  <>
    {newForm}
    <hr/>
    <p>Sharing with</p>
    <Row lg={2}>
      {shared.map(s => (
        <Col key={s.id}>
          <Card>
            <Card.Body>
              <Card.Title>{s.email}</Card.Title>
              <Card.Text>
                <ShareForm
                  fetch_={fetch_}
                  as={as}
                  fetchShared={fetchShared}
                  share={s}
                />
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </>
}
