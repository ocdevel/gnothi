import {Button, Col, Form, Modal} from "react-bootstrap"
import _ from "lodash"
import React, {useEffect, useState} from "react"
import { FaPen } from 'react-icons/fa'

import {SimplePopover, trueKeys} from "./utils"
import {useStoreState, useStoreActions} from "easy-peasy";
import {FaTags} from "react-icons/fa/index";

function TagForm({tag=null}) {
  const [name, setName] = useState(tag ? tag.name : '')
  const fetch = useStoreActions(actions => actions.server.fetch)
  const getTags = useStoreActions(actions => actions.j.tags)

  const onSubmit = () => getTags()

  const id = tag && tag.id

  const changeName = e => setName(e.target.value)

  const destroyTag = async () => {
    if (!window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      return
    }
    await fetch({route: `tags/${id}`, method: 'DELETE'})
    onSubmit()
  }

  const submit = async e => {
    e.preventDefault()
    if (id) {
      await fetch({route: `tags/${id}`, method: 'PUT', body: {name}})
    } else {
      await fetch({route: `tags`, method: 'POST', body: {name}})
    }
    onSubmit()
  }

  return <Form onSubmit={submit}>
    <Form.Row>
      <Form.Group as={Col} controlId="formFieldName">
        <Form.Control
          size='sm'
          type="text"
          placeholder="Tag Name"
          value={name}
          onChange={changeName}
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
  const tags = useStoreState(state => state.j.tags)

  return (
    <Modal show={true} onHide={close}>
      <Modal.Header closeButton>
        <Modal.Title>Tags</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <TagForm />
        {tags && tags.map(t => <TagForm key={t.id} tag={t}/> )}
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
  const fetch = useStoreActions(actions => actions.server.fetch)
  const getTags = useStoreActions(actions => actions.j.getTags)
  // tags sorted on server
  const tags = useStoreState(state => state.j.tags)
  const selectedTags = useStoreState(state => state.j.selectedTags)

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
      await fetch({route: `tags/${id}/toggle`, method: 'POST'})
      await getTags()
    }
  }
  // const clear = async () => {
  //   _.each(tags, t => {selectTag(t.id,false)})
  // }
  const showEditTags = () => setEditTags(true)
  const closeEditTags = () => setEditTags(false)

  const renderTag = t => {
    const selected_ = selectedTags_[t.id]
    return <>
      <Button
        disabled={noClick}
        variant="link"
        className={`mr-1 ${selected_ ? 'tag-selected' : 'tag-unselected'}`}
        onClick={() => selectTag(t.id, !selected_)}
      >{t.name}</Button>
    </>
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
