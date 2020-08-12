import React, {useEffect, useState} from "react";
import _ from 'lodash'
import {AiStatusMsg, spinner, trueKeys, SimplePopover} from "./utils";
import {Button, Table, Form, ButtonGroup} from "react-bootstrap";
import {FaTags, FaUser, FaThumbsUp, FaThumbsDown, FaCheck} from "react-icons/fa"
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

  const shelve = async (bid, shelf) => {
    await fetch_(`books/${bid}/${shelf}`, 'POST')
    _.remove(books, {id: bid})
    setBooks(_.reject(books, {id: bid}))
    // fetchBooks()
  }

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
            <SimplePopover text="Like and save for later">
              <Button variant='outline-dark' onClick={() => shelve(b.id, 'liked')}>
                <FaThumbsUp />
              </Button>
            </SimplePopover>
            <SimplePopover text="Dislike, remove from list">
              <Button variant='outline-dark' onClick={() => shelve(b.id, 'disliked')}>
                <FaThumbsDown />
              </Button>
            </SimplePopover>
            <SimplePopover text="I've already read this; like it, but don't save">
              <Button variant='outline-dark' onClick={() => shelve(b.id, 'already_read')}>
                <FaCheck />
              </Button>
            </SimplePopover>
          </ButtonGroup>
        </div>
        <hr />
      </div>)}
    </div>
  </>
}
