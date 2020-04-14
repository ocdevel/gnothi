import {OverlayTrigger, Popover, Spinner} from "react-bootstrap";
import React from "react";

const fetch_ = async (route, method='GET', body=null, jwt=null) => {
  const obj = {
    method,
    headers: {'Content-Type': 'application/json'},
  };
  if (body) obj['body'] = JSON.stringify(body)
  if (jwt) obj['headers']['Authorization'] = `JWT ${jwt}`
  const response = await fetch(`http://192.168.0.2:5001/${route}`, obj)
  return await response.json()
}

const spinner = (
  <Spinner animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
)

const sentimentTip = (
  <Popover>
    <Popover.Content>
      Sentiment is machine-generated from your entry's text
    </Popover.Content>
  </Popover>
);

const sent2face = (sentiment) => {
  if (!sentiment) {return null}
  const style = {}
  style.backgroundColor = {
    POSITIVE: '#24cc8f',
    NEGATIVE: '#ff6165',
  }[sentiment]
  style.padding = 5
  style.marginRight = 5
  return (
    <OverlayTrigger
      trigger={["hover", "focus"]}
      placement="right"
      overlay={sentimentTip}
    >
      <span style={style}>{{POSITIVE: '🙂', NEGATIVE: '🙁'}[sentiment]}</span>
    </OverlayTrigger>
  )
}

export {fetch_, spinner, sent2face}
