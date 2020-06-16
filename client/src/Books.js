import React, {useEffect, useState} from "react";
import {spinner, trueKeys} from "./utils";
import {Button, Table} from "react-bootstrap";
import {FaTags, FaUser} from "react-icons/fa"

export default function Books({fetch_, as, tags}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)

  const fetchBooks = async () => {
    setFetching(true)
    const body = {}
    const tags_ = trueKeys(tags)
    if (tags_.length) { body['tags'] = tags_ }
    const {data, code, message} = await fetch_('books', 'POST', body)
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setBooks(data)
  }

  if (notShared) {return <h5>{notShared}</h5>}

  return <>
    {fetching ? (
      <>
        {spinner}
        <p className='text-muted'>Loading book recommendations (1-10seconds)</p>
      </>
    ) : (
      <Button
        className='bottom-margin'
        variant='primary'
        onClick={fetchBooks}
      >Show Books</Button>
    )}
    <div>
      {books.map(b => <div>
        <h5>{b.title}</h5>
        <p>
          <FaUser /> {b.author}<br/>
          <FaTags /> {b.topic}</p>
        <p>{b.text}</p>
        <hr />
      </div>)}
    </div>
  </>
}
