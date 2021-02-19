import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {spinner, SimplePopover, fmtDate} from "../utils"
import {
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Row,
  Col,
  Alert
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import MarkdownIt from 'markdown-it'
import MdEditor from 'react-markdown-editor-lite'
import _ from 'lodash'

import {useStoreActions, useStoreState} from "easy-peasy";

const mdParser = new MarkdownIt(/* Markdown-it options */);

// https://github.com/HarryChen0506/react-markdown-editor-lite/blob/master/docs/plugin.md
const plugins = [
  'header',
  'font-bold',
  'font-italic',
  'font-underline',
  'font-strikethrough',
  'list-unordered',
  'list-ordered',
  'block-quote',
  // 'image',
  'link',
  'mode-toggle',
  'full-screen',
  // f3b13052: auto-resize
]

function Editor({text, changeText}) {
  const fetch = useStoreActions(actions => actions.server.fetch)

  function onChange({html, text}) {
    changeText(text)
  }

  return (
    <MdEditor
      plugins={plugins}
      value={text}
      style={{ height: 300, width: '100%' }}
      config={{view: { menu: true, md: true, html: false }}}
      renderHTML={(text) => mdParser.render(text)}
      onChange={onChange}
      placeholder="Write a description about your group, including any links to relevant material."
    />
  )
}

const privacies = [{
  k: 'public',
  v: 'Public',
  h: "Any user can join this group."
}, {
  k: 'private',
  v: 'Private',
  h: "Group administrators must manually send invite links to users for them to join this group."
}, {
  k: 'paid',
  v: 'Paid',
  h: "You'll charge users a monthly fee for access to this group. You take 70%, Gnothi takes 30%. Setup on the next page."
}]

export default function CreateGroup({show, close}) {
  const history = useHistory()
  const [form, setForm] = useState({title: '', text: '', privacy: "public"})
  const [submitting, setSubmitting] = useState(false)
  const setServerError = useStoreActions(actions => actions.server.setError)

  const as = useStoreState(state => state.user.as)
  const fetch = useStoreActions(actions => actions.server.fetch)

  const submit = async e => {
    e.preventDefault()
    setServerError(false)
    setSubmitting(true)
    const res = await fetch({route: `groups`, method: 'POST', body: form})
    setSubmitting(false)
    if (res.code !== 200) {return}
    history.push(`/groups/${res.data.id}`)
  }

  const changeTitle = e => {
    setForm({...form, title: e.target.value})
  }
  const changeText = text => {
    setForm({...form, text})
  }

  const renderButtons = () => {
    if (as) return null
    if (submitting) return spinner

    return <>
      <Button variant='link' className='text-secondary' size="sm" onClick={close}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={submit}
      >Submit
      </Button>
    </>
  }

  const renderForm = () => <>
    <Row>
      <Col>
        <Form onSubmit={submit}>
          <Form.Group controlId="formTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={changeTitle}
            />
          </Form.Group>

          <Editor text={form.text} changeText={changeText} />

          <fieldset>
            <Form.Group as={Row}>
              <Form.Label as="legend" column sm={2}>
                privacy
              </Form.Label>
              <Col sm={10}>
                {privacies.map(({k, v, p}) => <>
                  <Form.Check
                    checked={k === form.privacy}
                    onChange={() => setForm({...form, privacy: k})}
                    key={k}
                    type="radio"
                    label={v}
                    name={k}
                    id={`radio-${k}`}
                  />
                </>)}
              </Col>
            </Form.Group>
          </fieldset>
        </Form>
      </Col>

    </Row>

  </>

  return <>
    <Modal
      show={show}
      size='xl'
      onHide={close}
      scrollable={true}
      keyboard={false}
      backdrop='static'
    >
      <Modal.Header closeButton>
        <Modal.Title>Create a Group</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {renderForm()}
      </Modal.Body>


      <Modal.Footer>
        {renderButtons()}
      </Modal.Footer>
    </Modal>
  </>
}
