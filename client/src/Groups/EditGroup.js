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
  h: "You'll charge users a monthly fee (that you decided) for access to this group. You take 70%, Gnothi takes 30%. Setup on the next page.",
  disabled: "This feature coming soon."
}]

function PrivacyOpt({p, form, setForm}) {
  const {k, v, h, disabled} = p
  return <div>
    <Form.Check
      checked={k === form.privacy}
      onChange={() => setForm({...form, privacy: k})}
      disabled={!!disabled}
      type="radio"
      label={v}
      name={k}
      id={`radio-${k}`}
    />
    {h && <Form.Text className='muted'>{h}</Form.Text>}
    {disabled && <Form.Text className='text-warning'>{disabled}</Form.Text>}
  </div>
}

const default_form = {
  title: '',
  text_short: '',
  text_long: '',
  privacy: "public"
}

export default function EditGroup({show, close, group=null}) {
  const history = useHistory()
  const emit = useStoreActions(actions => actions.ws.emit)
  const as = useStoreState(s => s.user.as)
  const postRes = useStoreState(s => s.ws.res['groups/groups/post'])

  const [form, setForm] = useState(group || default_form)

  useEffect(() => {
    EE.on("wsResponse", onPost)
    return () => EE.off("wsResponse", onPost)
  }, [])

  function onPost(data) {
    if (data.action === 'groups/groups/post' && data.data?.id) {
      close()
      history.push("groups/" + data.data.id)
    }
    if (data.action === 'groups/group/put') {
      close()
    }
  }

  const submit = async e => {
    e.preventDefault()
    const action = group ? "groups/group/put" : "groups/groups/post"
    emit([action, form])
  }

  const changeText = k => e => {
    const v = typeof e === 'string' ? e : e.target.value
    setForm({...form, [k]: v})
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

  const renderForm = () => {
    let short_placeholder = "Short description of your group."
    if (!group) {
      short_placeholder += " You'll be able to add a long description with links, formatting, resources, etc on the next screen."
    }
    const text_long = form.text_long || ''

    return <>
      <Form onSubmit={submit}>
        <Form.Group controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={changeText('title')}
          />
        </Form.Group>

        <Form.Group className='mb-2'>
          <Form.Label>Short Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder={short_placeholder}
            value={form.text_short}
            onChange={changeText('text_short')}
          />
        </Form.Group>
        {group && <Editor text={text_long} changeText={changeText('text_long')} />}

        <Form.Group>
          <Form.Label>
            Privacy
          </Form.Label>
          <Card><Card.Body>
            {privacies.map((p) => <PrivacyOpt p={p} key={p.k} form={form} setForm={setForm}/>)}
          </Card.Body></Card>
        </Form.Group>

        <Form.Label>Perks</Form.Label>
        <Card><Card.Body>
          <Form.Control>
            <Form.Label>
              Membership
            </Form.Label>
            <Form.Control
              type='number'
              placeholder="Price of membership"
            />
          </Form.Control>
          <Form.Control>
            <Form.Label>
              Personal Responses
            </Form.Label>
            <Form.Control
              type='number'
              placeholder="Price of personal responses"
            />
          </Form.Control>
          <Form.Control>
            <Form.Label>
              Video sessions
            </Form.Label>
            <Form.Control
              type='number'
              placeholder="Price of membership"
            />
          </Form.Control>
        </Card.Body></Card>
      </Form>
    </>
  }

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
