import {Card, Button, Form, Row, Col} from "react-bootstrap"
import React, {useEffect, useState} from "react"
import _ from 'lodash'
import Tags from './Tags'

import {useSelector, useDispatch} from "react-redux"
import { fetch_ } from './redux/actions'

const feature_map = {
  fields: {
    label: "Fields & Charts",
    help: "User can view your fields & field-entries, history, and charts."
  },
  profile: {
    label: 'Profile & People',
    help: "User can view your profile data and any people you've listed."
  },
  books: {
    label:'Books',
    help: "User can view your AI-recommended books, your bookshelves (liked, disliked, etc), and can recommend books to you (goes to 'Recommended' shelf)."
  },
}

function ShareForm({fetchShared, share=null}) {
  const [form, setForm] = useState(share ? _.pick(share, ['email', ..._.keys(feature_map)]) : {})
  const [tags, setTags] = useState(share ? share.tags : {})
  const [saved, setSaved] = useState(false)

  const dispatch = useDispatch()

  const submit = async e => {
    e.preventDefault()
    const body = {
      ...form,
      tags: tags,
    }
    if (share) {
      setSaved(true)
      await dispatch(fetch_(`shares/${share.id}`, 'PUT', body))
      setTimeout(() => {setSaved(false)}, 2000)
    } else {
      await dispatch(fetch_('shares', 'POST', body))
      setForm({})
      setTags({})
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
    await dispatch(fetch_(`shares/${share.id}`, 'DELETE'))
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

      {_.map(feature_map, (v, k) => (
        <Form.Group>
          <Form.Check
            id={`${ctrlId}-${k}`}
            type="checkbox"
            label={v.label}
            checked={form[k]}
            onChange={chooseFeature(k)}
          />
          <Form.Text className="text-muted">{v.help}</Form.Text>
        </Form.Group>
      ))}

      <h5>Entries</h5>
      <p className='text-muted small'>
        User can view entries with these tags, and can use features involving these entries:
        <ul>
          <li>Summaries</li>
          <li>Question-answering</li>
          <li>Themes</li>
        </ul>
        Example use: sharing darker entries with a therapist, and lighter entries (eg travel, dreams) with friends.
      </p>
      <Tags
        selected={tags}
        setSelected={setTags}
      />

      <br />
      <br />

      <Button
        variant="primary"
        type="submit"
        disabled={saved}
      >
        {saved ? 'Saved' : share ? 'Save' : 'Submit'}
      </Button>&nbsp;
      {share && <Button variant="danger" size="sm" onClick={unshare}>Unshare</Button>}
    </Form>
  </div>
}

export default function Sharing() {
  const [shared, setShared] = useState([])
  const [notShared, setNotShared] = useState()
  const as = useSelector(state => state.as)

  const dispatch = useDispatch()

  const fetchShared = async () => {
    const {data, code, message} = await dispatch(fetch_('shares', 'GET'))
    if (code === 401) {return setNotShared(message)}
    setShared(data)
  }

  useEffect(() => {fetchShared()}, [as])

  if (notShared) {return <h5>{notShared}</h5>}

  const newForm = <ShareForm
    fetchShared={fetchShared}
  />

  if (_.isEmpty(shared)) {return newForm}

  return  <>
    {newForm}
    <hr/>
    <p>Sharing with</p>
    <Row lg={3} sm={2} xs={1}>
      {_.sortBy(shared.slice(), 'id').map(s => (
        <Col key={s.id}>
          <Card>
            <Card.Body>
              <Card.Title>{s.email}</Card.Title>
              <Card.Text>
                <ShareForm
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
