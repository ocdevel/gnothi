import {OverlayTrigger, Popover, Spinner} from "react-bootstrap";
import React from "react";

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

export {spinner, sent2face}
