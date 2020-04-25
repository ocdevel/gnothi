import React, {useEffect, useState} from "react";
import {sent2face, spinner, trueKeys} from "./utils";
import {Button, Card, Form} from "react-bootstrap";
import _ from "lodash";
import Tags from "./Tags";

export default function Themes({fetch_, as}) {
  const [topics, setTopics] = useState({})
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [tags, setTags] = useState({})

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
    <div className='bottom-margin'>
      <Tags
        fetch_={fetch_}
        as={as}
        selected={tags}
        setSelected={setTags}
        noEdit={true}
      />
    </div>

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
