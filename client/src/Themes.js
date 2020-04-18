import React, {useEffect, useState} from "react";
import {sent2face, spinner} from "./utils";
import {Card, Form} from "react-bootstrap";
import _ from "lodash";

export default function Themes({fetch_}) {
  const [topics, setTopics] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [fetching, setFetching] = useState(false)

  const fetchTopics = async () => {
    setFetching(true)
    let url = 'gensim'
    if (advanced) {url += '?advanced=1'}
    const res = await fetch_(url, 'GET')
    setTopics(res.ok ? res : {})
    setFetching(false)
  }

  useEffect(() => {fetchTopics()}, [advanced])

  const changeAdvanced = e => setAdvanced(e.target.checked)

  return <>
    <Form.Group controlId="formAdvanced">
      <Form.Check
        type="checkbox"
        label="More Accurate"
        checked={advanced}
        onChange={changeAdvanced}
      />
      <Form.Text>Uses more advanced algorithm which is more accurate, but MUCH slower</Form.Text>
    </Form.Group>
    {fetching && spinner}
    {_.map(topics, (obj, topic)=>(
      <Card key={topic} className='bottom-margin'>
        <Card.Body>
          <Card.Title>Topic {topic}</Card.Title>
          {/*<Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle>*/}
          <Card.Text>
            {sent2face(obj.sentiment)}
            {obj.terms.join(', ')}
          </Card.Text>
        </Card.Body>
      </Card>
    ))}
  </>
}
