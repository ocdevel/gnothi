import React, {useEffect, useState} from "react";
import {sent2face, spinner, trueKeys} from "./utils";
import {Button, Card, Form} from "react-bootstrap";
import _ from "lodash";

export default function Themes({fetch_, as, tags}) {
  const [topics, setTopics] = useState({})
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)

  const fetchTopics = async () => {
    setFetching(true)
    const body = {}
    const tags_ = trueKeys(tags)
    if (tags_.length) { body['tags'] = tags_}
    const {data, code, message} = await fetch_('themes', 'POST', body)
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setTopics(data)
  }

  if (notShared) {return <h5>{notShared}</h5>}

  return <>
    {fetching ? spinner : (
      <Button
        className='bottom-margin'
        variant='primary'
        onClick={fetchTopics}
      >Show Themes</Button>
    )}
    {_.map(topics, (obj, topic)=>(
      <Card key={topic} className='bottom-margin'>
        <Card.Body>
          <Card.Title>Topic {topic}</Card.Title>
          {/*<Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle>*/}
          <Card.Text>
            {sent2face(obj.sentiment)}
            {obj.terms.join(', ')}

            {obj.summary && <p><hr/><b>Summary</b>: {obj.summary}</p>}
          </Card.Text>
        </Card.Body>
      </Card>
    ))}
  </>
}
