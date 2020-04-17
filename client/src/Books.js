import React, {useEffect, useState} from "react";
import {fetch_, spinner} from "./utils";
import {Table} from "react-bootstrap";

export default function Books({jwt}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)

  const fetchBooks = async () => {
    setFetching(true)
    const res = await fetch_('books', 'GET', null, jwt)
    setBooks(res)
    setFetching(false)
  }

  useEffect(() => {
    fetchBooks()
  }, [])

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
