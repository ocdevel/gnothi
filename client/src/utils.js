import {OverlayTrigger, Popover, Spinner} from "react-bootstrap";
import React from "react";
import _ from "lodash";

const spinner = (
  <Spinner animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
)

const SimplePopover = ({children, text}) => (
  <OverlayTrigger
    overlay={<Popover>
      <Popover.Content>
        {text}
      </Popover.Content>
    </Popover>}
    trigger={['hover', 'focus']}
  >
    {children}
  </OverlayTrigger>
)

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
    <SimplePopover text="Sentiment is machine-generated from your entry's text">
      <span style={style}>{{POSITIVE: '🙂', NEGATIVE: '🙁'}[sentiment]}</span>
    </SimplePopover>
  )
}

const trueKeys = o => _.transform(o, (m,v,k) => {if (v) {m.push(k)}}, [])

export {spinner, sent2face, trueKeys, SimplePopover}
