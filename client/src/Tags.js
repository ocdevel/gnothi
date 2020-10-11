import {Button, Col, Form, Modal} from "react-bootstrap"
import _ from "lodash"
import React, {useEffect, useState} from "react"
import { FaPen } from 'react-icons/fa'

import {SimplePopover, trueKeys} from "./utils"
import { useSelector, useDispatch } from 'react-redux'
import { fetch_, getTags } from './redux/actions'
import {FaTags} from "react-icons/fa/index";

function TagForm({tag=null}) {
  const [name, setName] = useState(tag ? tag.name : '')
  const dispatch = useDispatch()
  const onSubmit = () => dispatch(getTags())

  const id = tag && tag.id

  const changeName = e => setName(e.target.value)

  const destroyTag = async () => {
    if (!window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      return
    }
    await dispatch(fetch_(`tags/${id}`, 'DELETE'))
    onSubmit()
  }

  const submit = async e => {
    e.preventDefault()
    if (id) {
      await dispatch(fetch_(`tags/${id}`, 'PUT', {name}))
    } else {
      await dispatch(fetch_(`tags`, 'POST', {name}))
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
          variant={id ? "primary" : "success"}
          onClick={submit}
        >{id ? "Save" : "Add"}</Button>&nbsp;
        {id && !tag.main && <Button
          size='sm'
          variant='danger'
          onClick={destroyTag}
        >Delete</Button>}
      </Form.Group>
    </Form.Row>
  </Form>
}

function TagModal({close}) {
  const tags = useSelector(state => state.tags)

  return (
    <Modal show={true} onHide={close}>
      <Modal.Header>
        <Modal.Title>Tags</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <TagForm />
        {tags && tags.map(t => <TagForm key={t.id} tag={t}/> )}
      </Modal.Body>

      <Modal.Footer>
        <Button size="sm" variant="secondary" onClick={close}>Close</Button>
      </Modal.Footer>
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
  const as = useSelector(state => state.as)
  // tags sorted on server
  const tags = useSelector(state => state.tags)
  const selectedTags = useSelector(state => state.selectedTags)
  const dispatch = useDispatch()

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
      await dispatch(fetch_(`tags/${id}/toggle`, 'POST'))
      await dispatch(getTags())
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
        size="sm"
        variant={selected_ ? 'dark' : 'outline-dark'}
        onClick={() => selectTag(t.id, !selected_)}
      >{t.name}</Button>&nbsp;
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
  <div className='bottom-margin'>
    <SimplePopover text="Tags">
      <FaTags/>
    </SimplePopover>
    <span className='tools-divider'/>
    <Tags />
  </div>
)
