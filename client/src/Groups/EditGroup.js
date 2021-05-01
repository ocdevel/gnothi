import {useHistory, useParams} from "react-router-dom"
import React, {useEffect, useState, useContext, useCallback} from "react"
import {
  Button,
  Form,
  InputGroup, FormControl
} from "react-bootstrap"
import ReactMarkdown from "react-markdown"
import MarkdownIt from 'markdown-it'
import MdEditor from 'react-markdown-editor-lite'
import _ from 'lodash'
import {EE} from '../redux/ws'

import {useStoreActions, useStoreState} from "easy-peasy";
import Error from "../Error";
import * as yup from "yup";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {CircularProgress, DialogActions, DialogContent, Card, CardHeader, CardContent,
  Grid} from "@material-ui/core";
import {BasicDialog} from "../Helpers/Dialog";

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

function Editor({form}) {
  const [text, setText] = useState("")

  function onChange({html, text}) {
    setText(text)
    form.setValue('text_long', text)
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

const notYet = <b>This feature isn't yet built, but you can enable it now and I'll notify you when it's available.</b>

const privacies = [{
  k: 'public',
  v: 'Public',
  h: "Any user can join this group. It's listed in the groups directory, and matched to users via Gnothi AI."
}, {
  k: 'matchable',
  v: 'Matchable',
  h: <>Any user can join this group, but they won't see it unless Gnothi AI considers them a good fit based on their journal entries. This is a layer of privacy for sensitive groups, Gnothi strives to find good culture fits.</>
}, {
  k: 'private',
  v: 'Private',
  h: <>Group administrators must manually send invite links to users for them to join this group. {notYet}</>
}]
const privaciesObj = _.keyBy(privacies, 'k')

const perks = [{
  k: 'perk_member',
  v: "Membership",
  h: "You can charge users to join this group, or suggest a donation for membership. Sounds mean, but consider groups who's moderator is donating time to ensure quality attention to its members."
}, {
  k: "perk_entry",
  v: "Journal Feedback",
  h: "You can charge to provide personal feedback on journal entries which members share with the group. Anyone can comment on each others' entries, but perhaps you're an expert in the group's topic and they'd find your feedback particularly valuable. It's on you to keep up with the entries as they're created, but I'll do my best to provide good tooling for the moderators."
}, {
  k: "perk_video",
  v: "Video Sessions",
  h: <>You can charge to run scheduled video sessions with your members. When available, I'll provide scheduling and video tooling. {notYet}</>
}]

const perk_field = yup
  .number()
  .nullable()
  .min(1)
  .transform((value, originalValue) => (String(originalValue).trim() === '' ? null : value))

const groupSchema = yup.object().shape({
  title: yup.string().required(),
  text_short: yup.string().required(),
  text_long: yup.string(),
  privacy: yup.string().required(),
  perk_member: perk_field,
  perk_member_donation: yup.boolean(),
  perk_entry: perk_field,
  perk_entry_donation: yup.boolean(),
  perk_video: perk_field,
  perk_video_donation: yup.boolean(),
})


const defaultForm = {
  title: "",
  text_short: "",
  text_long: "",
  privacy: "public",
  perk_member: null,
  perk_member_donation: false,
  perk_entry: null,
  perk_entry_donation: false,
  perk_video: null,
  perk_video_donation: false,
}

function Perk({form, perk}) {
  const {formState: {errors}, register} = form
  return <Grid item xs={1} sm={4}>
    <Form.Group>
      <Form.Label>{perk.v}</Form.Label>
      <Form.Label htmlFor={`${perk.k}-price`} srOnly>Price</Form.Label>
      <InputGroup className="mb-2">
        <InputGroup.Prepend>
          <InputGroup.Text>$</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl
          id={`${perk.k}-price`}
          placeholder="Free"
          type="number"
          isInvalid={errors?.[perk.k]}
          {...register(perk.k)}
        />
        {errors?.[perk.k] && <Form.Control.Feedback type="invalid">{errors[perk.k].message}</Form.Control.Feedback>}
      </InputGroup>
      <Form.Check
        type="checkbox"
        className="mb-2"
        label="Suggested Donation"
        {...register(`${perk.k}_donation`)}
      />
      <Form.Text className='text-muted'>{perk.h}</Form.Text>
    </Form.Group>
  </Grid>
}

export default function EditGroup({show, close, group=null}) {
  const history = useHistory()
  const emit = useStoreActions(actions => actions.ws.emit)
  const as = useStoreState(s => s.user.as)
  const groupPost = useStoreState(s => s.ws.data['groups/groups/post'])
  const groupPut = useStoreState(s => s.ws.res['groups/group/put'])
  const clear = useStoreActions(a => a.ws.clear)

  const form = useForm({
    defaultValues: group || defaultForm,
    resolver: yupResolver(groupSchema),
  })
  const privacy = form.watch('privacy')
  const {register, formState: {errors}} = form

  useEffect(() => {
    return function() {
      clear(['groups/groups/post', 'groups/group/put'])
    }
  }, [])

  useEffect(() => {
    if (groupPost?.id) {
      close()
      history.push("groups/" + groupPost.id)
    }
  }, [groupPost])

  useEffect(() => {
    if (groupPut?.code === 200) {close()}
  }, [groupPut])

  function submit(data) {
    if (group) {
      emit(['groups/group/put', {id: group.id, ...data}])
    } else {
      emit(['groups/groups/post', data])
    }
  }

  const renderButtons = () => {
    if (as) return null
    if (groupPost?.submitting) return <CircularProgress />

    return <>
      <Button variant='link' className='text-secondary' size="sm" onClick={close}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={form.handleSubmit(submit)}
      >Submit
      </Button>
    </>
  }

  const renderForm = () => {
    let short_placeholder = "Short description of your group."
    if (!group) {
      short_placeholder += " You'll be able to add a long description with links, formatting, resources, etc on the next screen."
    }

    return <>
      <Form>
        <Form.Group controlId="form_title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Title"
            isInvalid={errors?.title}
            {...register("title")}
          />
          {errors?.title && <Form.Control.Feedback type="invalid">{errors.title.message}</Form.Control.Feedback>}
        </Form.Group>

        <Form.Group className='mb-2' controlId="form_text_short">
          <Form.Label>Short Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            isInvalid={errors?.text_short}
            placeholder={short_placeholder}
            {...register("text_short")}
          />
        </Form.Group>
        {errors?.text_short && <Form.Control.Feedback type="invalid">{errors.text_short.message}</Form.Control.Feedback>}

        {group && <Editor form={form} />}

        <Form.Group controlId='form_privacy'>
          <Form.Label>Privacy</Form.Label>
          <Form.Control
            as="select"
            {...register("privacy")}
          >
            {privacies.map(p => <option key={p.k} value={p.k}>{p.v}</option>)}
          </Form.Control>
          <Form.Text>{privaciesObj[privacy].h}</Form.Text>
        </Form.Group>

        <Card className='mb-2'>
          <CardHeader title="perks" />
          <CardContent>
            <Grid container>
              {perks.map(p => <Perk key={p.k} perk={p} form={form} />)}
            </Grid>
          </CardContent>
        </Card>
      </Form>
    </>
  }

  return <>
    <BasicDialog
      open={show}
      size='xl'
      onClose={close}
      title={group ? "Edit Group" : "Create a Group"}
    >
      <DialogContent>
        {renderForm()}
        <Error action={/groups\/groups\/post/g} codes={[400,401,403,422]}/>
      </DialogContent>

      <DialogActions>
        {renderButtons()}
      </DialogActions>
    </BasicDialog>
  </>
}
