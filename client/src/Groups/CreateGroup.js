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
import {EE} from '../redux/ws'

import {useStoreActions, useStoreState} from "easy-peasy";
import Error from "../Error";

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
  const emit = useStoreActions(actions => actions.ws.emit)
  const as = useStoreState(s => s.user.as)

  const [form, setForm] = useState({title: '', text_short: '', privacy: "public"})
  const postRes = useStoreState(s => s.ws.res['groups/groups/post'])

  useEffect(() => {
    EE.on("wsResponse", onPost)
    return () => EE.off("wsResponse", )
  }, [])

  function onPost(data) {
    if (data.action === 'groups/groups/post' && data?.id) {
      close()
      history.push(postRes?.data.id)
    }
  }

  const submit = async e => {
    e.preventDefault()
    emit(["groups/groups/post", form])
  }

  const changeTitle = e => {
    setForm({...form, title: e.target.value})
  }
  const changeText = text_short => {
    setForm({...form, text_short})
  }

  const renderButtons = () => {
    if (as) return null
    if (postRes?.submitting) return spinner

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

          <Editor text={form.text_short} changeText={changeText} />

          <fieldset>
            <Form.Group as={Row}>
              <Form.Label as="legend" column sm={2}>
                privacy
              </Form.Label>
              <Col sm={10}>
                {privacies.map(({k, v, p}) => (
                  <Form.Check
                    checked={k === form.privacy}
                    onChange={() => setForm({...form, privacy: k})}
                    key={k}
                    type="radio"
                    label={v}
                    name={k}
                    id={`radio-${k}`}
                  />
                ))}
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
        <Error action={/groups\/groups\/post/g} codes={[400,401,403,422]}/>
      </Modal.Body>

      <Modal.Footer>
        {renderButtons()}
      </Modal.Footer>
    </Modal>
  </>
}
