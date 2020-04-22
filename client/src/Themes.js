import React, {useEffect, useState} from "react";
import {sent2face, spinner, trueKeys} from "./utils";
import {Button, Card, Form} from "react-bootstrap";
import _ from "lodash";
import Tags from "./Tags";

export default function Themes({fetch_, as}) {
  const [topics, setTopics] = useState({})
  const [advanced, setAdvanced] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [notShared, setNotShared] = useState(false)
  const [tags, setTags] = useState({})
  const [showTags, setShowTags] = useState(false)

  const fetchTopics = async () => {
    setFetching(true)
    const body = {advanced}
    if (showTags) {
      body['tags'] = trueKeys(tags)
    }
    const {data, code, message} = await fetch_('themes', 'POST', body)
    setFetching(false)
    if (code === 401) {return setNotShared(message)}
    setTopics(data)
  }

  if (notShared) {return <h5>{notShared}</h5>}

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
    <Form.Group controlId='themes-tags'>
      <Form.Check
        type='radio'
        label='All journals'
        id='themes-all-tags'
        inline
        checked={!showTags}
        onChange={() => setShowTags(false)}
      />
      <Form.Check
        type='radio'
        id='themes-specific-tags'
        label='Specific journals'
        inline
        checked={showTags}
        onChange={() => setShowTags(true)}
      />
    </Form.Group>
    {showTags && <div className='bottom-margin'>
      <Tags fetch_={fetch_} as={as} selected={tags} setSelected={setTags} noEdit={true} />
    </div>}
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
          </Card.Text>
        </Card.Body>
      </Card>
    ))}
  </>
}
