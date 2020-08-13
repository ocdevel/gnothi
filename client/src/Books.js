import React, {useEffect, useState} from "react";
import _ from 'lodash'
import {AiStatusMsg, spinner, trueKeys, SimplePopover} from "./utils";
import {Button, Table, Form, ButtonGroup} from "react-bootstrap";
import {FaTags, FaUser, FaThumbsUp, FaThumbsDown, FaCheck, FaTimes} from "react-icons/fa"
import ForXDays from "./ForXDays"

export default function Books({fetch_, as, tags, aiStatus}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [form, setForm] = useState({days: 365})

  const fetchBooks = async () => {
    setFetching(true)
    const body = {...form}
    const tags_ = trueKeys(tags)
    if (tags_.length) { body['tags'] = tags_ }
    const {data, code, message} = await fetch_('books', 'POST', body)
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setBooks(data)
  }

  if (notShared) {return <h5>{notShared}</h5>}

  const shelve = async (bid, shelf_) => {
    await fetch_(`books/${bid}/${shelf_}`, 'POST')
    _.remove(books, {id: bid})
    setBooks(_.reject(books, {id: bid}))
    // fetchBooks()
  }

  const ShelfButton = ({bid, shelf, icon, popover}) => (
    <SimplePopover text={popover}>
      <Button variant='outline-dark' onClick={() => shelve(bid, shelf)}>
        {icon()}
      </Button>
    </SimplePopover>
  )

  return <>
    <ForXDays
      form={form}
      setForm={setForm}
      feature={'resources'}
    />
    <div>
      {fetching ? <>
        <div>{spinner}</div>
        <Form.Text muted>Loading book recommendations (1-10seconds)</Form.Text>
      </> : <>
        <Button
          disabled={aiStatus !== 'on'}
          className='bottom-margin'
          variant='primary'
          onClick={fetchBooks}
        >Show Books</Button>
        <AiStatusMsg status={aiStatus} />
      </>}
    </div>
    <div>
      {books.length > 0 && <hr/>}
      {books.map(b => <div>
        <h5>{b.title}</h5>
        <p>
          <FaUser /> {b.author}<br/>
          <FaTags /> {b.topic}</p>
        <p>{b.text}</p>
        <div>
          <ButtonGroup>
            {as ? <>
              <ShelfButton bid={b.id} shelf='recommend' icon={FaThumbsUp} popover="Recommend this book to the user (remove from results)" />
            </> : <>
              <ShelfButton bid={b.id} shelf='like' icon={FaThumbsUp} popover="Like and save for later (remove from results)" />
              <ShelfButton bid={b.id} shelf='dislike' icon={FaThumbsDown} popover="Dislike (remove from results)" />
              <ShelfButton bid={b.id} shelf='already_read' icon={FaCheck} popover="I've read this. Like but don't save (remove from results)" />
              <ShelfButton bid={b.id} shelf='remove' icon={FaTimes} popover="Remove from results, but don't affect algorithm." />
            </>}
          </ButtonGroup>
        </div>
        <hr />
      </div>)}
    </div>
  </>
}
