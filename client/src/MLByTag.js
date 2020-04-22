import {Form} from "react-bootstrap";
import Tags from "./Tags";
import React, {useState} from "react";


export default function MLByTag({fetch_, as, tags, setTags}) {
  const [showTags, setShowTags] = useState(false)


  return <>
    <Form.Group controlId='ml-tags'>
      <Form.Check
        type='radio'
        label='All journals'
        id='ml-all-tags'
        inline
        checked={!showTags}
        onChange={() => setShowTags(false)}
      />
      <Form.Check
        type='radio'
        id='ml-specific-tags'
        label='Specific journals'
        inline
        checked={showTags}
        onChange={() => setShowTags(true)}
      />
    </Form.Group>
    {showTags && <div className='bottom-margin'>
      <Tags fetch_={fetch_} as={as} selected={tags} setSelected={setTags} noEdit={true} />
    </div>}
  </>
}
