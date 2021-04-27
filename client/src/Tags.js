import {Button, Col, Form, Modal} from "react-bootstrap"
import _ from "lodash"
import React, {useEffect, useState} from "react"
import {FaPen, FaSort} from 'react-icons/fa'

import {SimplePopover, trueKeys} from "./utils"
import {useStoreState, useStoreActions} from "easy-peasy";
import {FaTags} from "react-icons/fa/index";

import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";
import {useForm} from "react-hook-form";
import Sortable from "./Sortable";
import {IoReorderFourSharp, IoReorderThreeSharp, MdReorder} from "react-icons/all";
const tagSchema = yup.object().shape({
  name: yup.string().required(),
  ai: yup.boolean()
})

function TagForm({tag=null}) {
  const emit = useStoreActions(actions => actions.ws.emit)
  const form = useForm({
    resolver: yupResolver(tagSchema),
    defaultValues: tag || {}
  });

  const id = tag && tag.id

  const destroyTag = async () => {
    if (!window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      return
    }
    emit(['tags/tag/delete', {id}])
  }

  function submit(data) {
    if (id) {
      emit(['tags/tag/put', {...data, id}])
    } else {
      emit(['tags/tags/post', data])
    }
  }

  return <Form onSubmit={form.handleSubmit(submit)}>
    <Form.Row>
      {tag && <div><IoReorderFourSharp /></div>}
      <Form.Group as={Col} controlId={`tag-name-${tag?.id}`}>
        <Form.Control
          size='sm'
          type="text"
          placeholder="Tag Name"
          {...form.register('name')}
        />
      </Form.Group>
      <Form.Group controlId="buttons" as={Col}>
        <Button
          size='sm'
          variant={id ? "outline-primary" : "primary"}
          onClick={submit}
        >{id ? "Save" : "Add"}</Button>&nbsp;
        {id && !tag.main && <Button
          size='sm'
          variant='link'
          className='text-secondary'
          onClick={destroyTag}
        >Delete</Button>}
      </Form.Group>
    </Form.Row>
  </Form>
}

function TagModal({close}) {
  const emit = useStoreActions(a => a.ws.emit)
  const tags = useStoreState(s => s.ws.data['tags/tags/get'])
  function reorder(tags) {
    const data = _.map(tags, ({id}, order) => ({id, order}))
    emit(['tags/tags/reorder', data])

  }
  const renderTag = tag => <TagForm tag={tag} />

  return (
    <Modal size='xl' show={true} onHide={close}>
      <Modal.Header closeButton>
        <Modal.Title>Tags</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <TagForm />
        <Sortable items={tags} render={renderTag} onReorder={reorder} />
      </Modal.Body>
    </Modal>
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
    return <Button
      key={t.id}
      disabled={noClick}
      variant="link"
      className={`mr-1 ${selected_ ? 'tag-selected' : 'tag-unselected'}`}
      onClick={() => selectTag(t.id, !selected_)}
    >{t.name}</Button>
  }

  return <>
    {editTags && <TagModal close={closeEditTags} />}
    {/*<Button
      size="sm"
      variant={_.some(tags, 'selected') ? 'outline-primary' : 'primary'}
      onClick={clear}
    >Default</Button>&nbsp;*/}
    {tags.map(renderTag)}
    {!as && !noEdit && <Button
      size="sm"
      variant="light"
      onClick={showEditTags}
    ><FaPen /></Button>}
  </>
}

export const MainTags = (
  <div className='mb-3'>
    <SimplePopover text="Tags">
      <FaTags/>
    </SimplePopover>
    <span className='tools-divider'/>
    <Tags />
  </div>
)
