import React, {useEffect, useState} from "react"
import {OverlayTrigger, Popover, Spinner, Form, Alert} from "react-bootstrap"
import _ from "lodash"
import emoji from 'react-easy-emoji'
import moment from "moment-timezone";
import {FaThumbsUp, FaTags} from 'react-icons/fa'

export const spinner = (
  <Spinner animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
)

export const SimplePopover = ({children, text, overlayOpts={}}) => (
  <OverlayTrigger
    {...overlayOpts}
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

export const sent2face = (sentiment) => {
  if (!sentiment) {return null}
  const style = {}
  // style.backgroundColor = ~['joy', 'love', 'surprise'].indexOf(sentiment)
  //   ? '#24cc8f' : '#ff6165'
  // style.padding = 5
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

export const aiStatusEmoji = (status) => {
  const statusOpts = {props: {width: 16, height: 16}}
  return {
    off: emoji("🔴", statusOpts),
    pending: emoji("🟡", statusOpts),
    on: null,
  }[status]
}

export const trueKeys = o => _.transform(o, (m,v,k) => {if (v) {m.push(k)}}, [])

export const fmtDate = d => moment(d).format('YYYY-MM-DD ha')

export const bsSizes = {
  // Don't know what minWidth/maxWidth system is... just use arr[0] for now, figure out later
  // @media (min-width: 576px) {
  // .container {
  //   max-width: 540px;
  // }
  xs: 0,
  sm: 576, //540
  md: 768, //720
  lg: 992, //960
  xl: 1200, //1140
}
