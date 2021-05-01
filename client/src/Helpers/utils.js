import React, {useEffect, useState} from "react"
import _ from "lodash"
import emoji from 'react-easy-emoji'
import moment from "moment-timezone";
import {FaThumbsUp, FaTags} from 'react-icons/fa'
import {Tooltip} from "@material-ui/core";

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
    <Tooltip title="Sentiment is machine-generated from your entry's text">
      <span style={style}>{emoji_}</span>
    </Tooltip>
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

export function trueKeys(obj) {
  if (!obj) {return []}
  return _.reduce(obj, (m, v, k) => {
    if (v) { return [...m, k]}
    return m
  }, [])
}
export function trueObj(arr) {
  if (!arr) {return {}}
  return _.reduce(arr, (m, v) => {
    if (v) { return {...m, [v]: true}}
    return m
  }, {})
}

export const fmtDate = d => moment(d).format('YYYY-MM-DD ha')

export const timeAgo = d => moment(d).fromNow(true) + ' ago'

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

export const DEFAULT_IDS = {
  ADMIN_ID: '484b32c8-6463-49c5-83ca-75340f0abdc3',
  GROUP_ID: 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035',
}
