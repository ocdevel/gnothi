import {OverlayTrigger, Popover, Spinner} from "react-bootstrap"
import React from "react"
import _ from "lodash"
import emoji from 'react-easy-emoji'

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
  style.backgroundColor = ~['joy', 'love', 'surprise'].indexOf(sentiment)
    ? '#24cc8f' : '#ff6165'
  style.padding = 5
  style.marginRight = 5
  const emoji_ = {
    sadness: emoji("😢"),
    joy: emoji("😃"),
    love: emoji("🥰"),
    anger: emoji("😡"),
    fear: emoji("😱"),
    surprise: emoji("😯"),
  }[sentiment] || emoji("⚠")
  return (
    <SimplePopover text="Sentiment is machine-generated from your entry's text">
      <span style={style}>{emoji_}</span>
    </SimplePopover>
  )
}

const trueKeys = o => _.transform(o, (m,v,k) => {if (v) {m.push(k)}}, [])

export {spinner, sent2face, trueKeys, SimplePopover}
