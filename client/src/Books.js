import React, {useEffect, useState} from "react";
import {spinner} from "./utils";
import {Table} from "react-bootstrap";

export default function Books({fetch_}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)

  const fetchBooks = async () => {
    setFetching(true)
    const {data, code, message} = await fetch_('books', 'GET')
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setBooks(data)
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  if (notShared) {return <h5>{notShared}</h5>}

  return <>
    {fetching ? (
      <>
        {spinner}
        <p className='text-muted'>Loading book recommendations (1-10seconds)</p>
      </>
    ) : (
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
    )}
  </>
}
