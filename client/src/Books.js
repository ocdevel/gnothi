import React, {useEffect, useState} from "react";
import {spinner, trueKeys} from "./utils";
import {Button, Table} from "react-bootstrap";

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
    <Table>
      <thead>
        <th>Author</th>
        <th>Title</th>
        <th>Description</th>
        <th>Topic</th>
      </thead>
      <tbody>
        {books.map(b => <tr>
          <td>{b.author}</td>
          <td>{b.title}</td>
          <td>{b.text}</td>
          <td>{b.topic}</td>
        </tr>)}
      </tbody>
    </Table>
  </>
}
