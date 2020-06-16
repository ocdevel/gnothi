import React, {useEffect, useState} from "react";
import {spinner, trueKeys} from "./utils";
import {Button, Form, Table, Col} from "react-bootstrap";
import {FaTags, FaUser} from "react-icons/fa"
import _ from 'lodash'

export default function Books({fetch_, as, tags}) {
  const [books, setBooks] = useState([])
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [opts, setOpts] = useState({metric: 'cosine', similarity: 'global', })

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
    <Form>
      <Form.Row>
        <Form.Group controlId="formMetric" as={Col}>
          <Form.Label>Metric</Form.Label>
          <Form.Control
            as="select"
            value={'euclidean'}
            onChange={_.noop}
          >
            <option>euclidean</option>
            <option>cosine</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formCenter" as={Col}>
          <Form.Label>Center</Form.Label>
          <Form.Control
            as="select"
            value={'global'}
            onChange={_.noop}
          >
            <option>centroid</option>
            <option>product</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formByCluster" as={Col}>
          <Form.Label>Similarity</Form.Label>
          <Form.Control
            as="select"
            value={'by_cluster'}
            onChange={_.noop}
          >
            <option value="cluster">By Cluster (+60sec)</option>
            <option value="global">Global</option>
          </Form.Control>
        </Form.Group>
      </Form.Row>
    </Form>

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
