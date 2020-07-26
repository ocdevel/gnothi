import {Button, Col, Form, Modal} from "react-bootstrap"
import _ from "lodash"
import React, {useEffect, useState} from "react"
import { FaPen } from 'react-icons/fa'

function TagForm({fetch_, onSubmit, tag=null}) {
  const [name, setName] = useState(tag ? tag.name : '')

  const id = tag && tag.id

  const changeName = e => setName(e.target.value)

  const destroyTag = async () => {
    if (!window.confirm("Are you sure? This will remove this tag from all entries (your entries will stay).")) {
      return
    }
    await fetch_(`tags/${id}`, 'DELETE')
    onSubmit()
  }

  const submit = async e => {
    e.preventDefault()
    if (id) {
      await fetch_(`tags/${id}`, 'PUT', {name})
    } else {
      await fetch_(`tags`, 'POST', {name})
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

function TagModal({fetch_, close, tags, fetchTags}) {
  return (
    <Modal show={true} onHide={close}>
      <Modal.Header>
        <Modal.Title>Tags</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <TagForm fetch_={fetch_} onSubmit={fetchTags} />
        {tags && tags.map(t =>
          <TagForm
            key={t.id}
            fetch_={fetch_}
            tag={t}
            onSubmit={fetchTags}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button size="sm" variant="secondary" onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}


export default function Tags({
  fetch_,
  as,
  selected=null,
  setSelected=null,
  noEdit=false,
  noClick=false,
  preSelectMain=false
}) {
  const [tags, setTags] = useState([])
  const [editTags, setEditTags] = useState(false)

  const fetchTags = async () => {
    const {data, code, message} = await fetch_('tags', 'GET')
    setTags(data)
    if (preSelectMain) {
      let main = _.find(data, t=>t.main)
      if (!main) {
        data[0].main = true
        main = data[0]
      }
      selectTag(main.id, true)
    }
  }

  useEffect(() => {fetchTags()}, [])

  const selectTag = (id, v) => setSelected({...selected, [id]: v})
  // const clear = async () => {
  //   _.each(tags, t => {selectTag(t.id,false)})
  // }
  const showEditTags = () => setEditTags(true)
  const closeEditTags = () => setEditTags(false)

  let sorted = []
  if (tags.length) {
    const main = _.find(tags, t => t.main)
    sorted = main ? [main] : []
    sorted = [...sorted, ..._.filter(tags, t => !t.main)]
  }

  const renderTag = t => {
    const selected_ = selected[t.id]
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
    {editTags && <TagModal
      fetch_={fetch_}
      fetchTags={fetchTags}
      tags={sorted}
      close={closeEditTags}
    />}
    {/*<Button
      size="sm"
      variant={_.some(tags, 'selected') ? 'outline-primary' : 'primary'}
      onClick={clear}
    >Default</Button>&nbsp;*/}
    {sorted.map(renderTag)}
    {!as && !noEdit && <Button
      size="sm"
      variant="light"
      onClick={showEditTags}
    ><FaPen /></Button>}
  </>
}
