import {Button, Col, Form, Modal, Row} from "react-bootstrap"
import _ from "lodash"
import React, {useCallback, useEffect, useState} from "react"
import {FaPen, FaRobot, FaSort, FaTrash} from 'react-icons/fa'

import {SimplePopover, trueKeys} from "./utils"
import {useStoreState, useStoreActions} from "easy-peasy";
import {FaTags} from "react-icons/fa/index";

import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";
import {useForm} from "react-hook-form";
import Sortable from "./Sortable";
import {IoReorderFourSharp, IoReorderThreeSharp, MdReorder} from "react-icons/all";
import {Link} from "react-router-dom";

import {Chip, Stack, Button as MButton} from '@material-ui/core'
import {CheckCircle, Label, Create} from "@material-ui/icons";
import {FullScreenDialog} from "./Helpers/Dialog";

const tagSchema = yup.object().shape({
  name: yup.string().required(),
  ai: yup.boolean()
})


function NewTag() {
  const emit = useStoreActions(actions => actions.ws.emit)
  const form = useForm({
    resolver: yupResolver(tagSchema),
    defaultValues: {ai: true}
  });

  function submit(data) {
    emit(['tags/tags/post', data])
    form.reset()
  }

  return <Form onSubmit={form.handleSubmit(submit)}>
    <Form.Group controlId={`tag-name`}>
      <Form.Row>
        <Col>
          <Form.Control
            size='sm'
            type="text"
            placeholder="New tag name"
            {...form.register('name')}
          />
        </Col>
        <Col xs='auto'>
          <Button
            size='sm'
            type='submit'
            variant="primary"
          >Add</Button>
        </Col>
      </Form.Row>
    </Form.Group>
  </Form>
}

function TagForm({tag}) {
  const emit = useStoreActions(actions => actions.ws.emit)
  // Can't use useForm() since need custom onChange (which tiggers submit)
  const [name, setName] = useState(tag.name)
  const [ai, setAi] = useState(tag.ai)
  const id = tag.id

  function submit(data) {
    emit(['tags/tag/put', data])
  }
  const waitSubmit = useCallback(_.debounce(submit, 200), [])

  const changeName = e => {
    const name = e.target.value
    waitSubmit({id, name, ai})
    setName(e.target.value)
  }
  const changeAi = e => {
    const ai = e.target.checked
    submit({id, name, ai})
    setAi(ai)
  }

  const destroyTag = async () => {
    if (window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      emit(['tags/tag/delete', {id}])
    }
  }

  return <div>
    <Form.Row>
      <Col xs='auto'>
        <IoReorderFourSharp />
      </Col>
      <Form.Group as={Col} controlId={`tag-name-${id}`}>
        <Form.Control
          size='sm'
          type="text"
          placeholder="Tag Name"
          value={name}
          onChange={changeName}
        />
      </Form.Group>
      <Col xs='auto'>
        <Form.Switch
          id={`tag-ai-${id}`}
          label={<FaRobot />}
          checked={ai}
          onChange={changeAi}
        />
      </Col>
      {tag.main ? <div /> : <Col xs='auto'>
        <Button
          size='sm'
          variant='link'
          className='text-secondary'
          onClick={destroyTag}
        ><FaTrash /></Button>
      </Col>}
    </Form.Row>
  </div>
}

function TagModal({close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const tags = useStoreState(s => s.ws.data['tags/tags/get'])
  const [showMore, setShowMore] = useState(false)

  function toggleMore() {setShowMore(!showMore)}
  function renderHelp() {
    return <div>
      <h5>About Tags</h5>
      <div className='text-muted small'>
        <div>Tags organize your journal entries by topic (eg personal, work, dreams). Some apps do this via <em>multiple journals</em>, like folders on a computer. Gnothi uses tags instead, adding more flexibility for entry-sharing & AI.</div>
        <Button size='sm' variant='link' onClick={toggleMore}>{showMore ? "Hide examples" : "Show examples / ideas"}</Button>
        {showMore && <div>
          Here's how Gnothi's creator uses tags:<ul>
          <li><b>Main</b>: My default. Most things go here.</li>
          <li><b>Dreams</b>: I record my dreams, as I'll be building some cool dream-analysis tooling into Gnothi. I disable <FaRobot /> on this tag, since I don't want Gnothi matching-making me to books / groups based on my dreams - that would be weird.</li>
          <li><b>Therapy</b>: I share this tag (see sidebar > Sharing) with my therapist. Before each session she can either read my entries, or run some AI reports (summarization, question-answering) for a quick update. That way we hit the ground running in our session. This is an example of the value of multiple tags per entry; I'll tag most things Main, and I'll <em>also</em> tag an entry Therapy if it's something I'm comfortable with my therapist reading.</li>
        </ul>
        </div>}
      </div>
      <h5 className='d-flex'><span className='mr-2'>About</span><Form.Switch disabled/> <FaRobot /></h5>
      <div className='text-muted small'>
        By default, Gnothi will use all of your tags to decide which entries "represent you". Those entries are then used for match-making you with books, groups, therapists, etc. There will likely be tags you don't want used; the obvious example is Dreams. If you dream-journal, create a tag called "Dreams" and un-check its <FaRobot />. That way you won't get super weird book / group recommendations.
      </div>
    </div>
  }

  function reorder(tags) {
    const data = _.map(tags, ({id}, order) => ({id, order}))
    emit(['tags/tags/reorder', data])

  }
  const renderTag = tag => <TagForm tag={tag} />

  return (
    <FullScreenDialog
      open={true}
      handleClose={close}
      title="Tags"
    >
      <Row>
        <Col sm={12} md={7}>
          <Sortable items={tags} render={renderTag} onReorder={reorder} />
          <NewTag />
        </Col>
        <Col sm={12} md={5}>
          {renderHelp()}
        </Col>
      </Row>
    </FullScreenDialog>
  )
}

export default function Tags({
  selected=null,
  setSelected=null,
  noEdit=false,
  noClick=false,
  preSelectMain=false
}) {
  const [editTags, setEditTags] = useState(false)
  const as = useStoreState(state => state.user.as)
  const emit = useStoreActions(actions => actions.ws.emit)
  // tags sorted on server
  const tags = useStoreState(s => s.ws.data['tags/tags/get'])
  const selectedTags = useStoreState(s => s.ws.data.selectedTags)

  // no selected,setSelected props indicates using global tags
  const selectedTags_ = selected || selectedTags

  useEffect(() => {
    if (tags.length && preSelectMain) {
      const main = _.find(tags, t=>t.main)
      if (main) {
        selectTag(main.id, true)
      }
    }
  }, [tags])


  const selectTag = async (id, v) => {
    if (setSelected) {
      setSelected({...selectedTags_, [id]: v})
    } else {
      emit(['tags/tag/toggle', {id}])
      // await getTags()  # fixme
    }
  }
  // const clear = async () => {
  //   _.each(tags, t => {selectTag(t.id,false)})
  // }
  const showEditTags = () => setEditTags(true)
  const closeEditTags = () => setEditTags(false)

  const renderTag = t => {
    const selected_ = selectedTags_[t.id]
    const opts = selected_ ? {icon: <CheckCircle />} : {variant: 'outlined'}
    return <Chip
      key={t.id}
      disabled={noClick}
      {...opts}
      onClick={() => selectTag(t.id, !selected_)}
      label={t.name}
    />
  }

  return <>
    {editTags && <TagModal close={closeEditTags} />}
    <Stack direction="row" spacing={1}>
      {tags.map(renderTag)}
      {!as && !noEdit && <Chip
        variant="outlined"
        color="primary"
        onClick={showEditTags}
        icon={<Create />}
        label={"Tags"}
      />}
    </Stack>
  </>
}

export const MainTags = (
  <Tags />
)
