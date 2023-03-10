import React, {useEffect, useState} from "react"
import _ from "lodash"
import emoji from 'react-easy-emoji'
import moment from "moment-timezone";
import dayjs from "dayjs"
import Tooltip from "@mui/material/Tooltip";

export const timezones = moment.tz.names()

export type Sentiment = "sadness" | "joy" | "love" | "anger" | "fear" | "surprise"| undefined
export function sent2face(sentiment: Sentiment) {
  if (!sentiment) {return null}
  const style = {}
  // style.backgroundColor = ~['joy', 'love', 'surprise'].indexOf(sentiment)
  //   ? '#24cc8f' : '#ff6165'
  // style.padding = 5
  style.marginRight = 5
  const emoji_ = {
    sadness: emoji("😭"),
    joy: emoji("😃"),
    love: emoji("🥰"),
    anger: emoji("😡"),
    fear: emoji("😨"),
    surprise: emoji("😯"),
    disgust: emoji("🤢"),
  // }[sentiment] || emoji("😐") // neutral
  }[sentiment] || null
  if (!emoji_) {return null}
  return (
    <Tooltip title="Sentiment is machine-generated from your entry's text">
      <span style={style} className='sentiment'>{emoji_}</span>
    </Tooltip>
  )
}

// export function trueKeys<T>(obj: T): Array<keyof T> {
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


// Format options at https://day.js.org/docs/en/display/format
export const fmtDate = (d: Date | string) => dayjs(d).format("dddd, MMMM D, YYYY")

export const timeAgo = (d: Date | string) => moment(d).fromNow(true) + ' ago'

export const DEFAULT_IDS = {
  ADMIN_ID: '484b32c8-6463-49c5-83ca-75340f0abdc3',
  GROUP_ID: 'ebcf0a39-9c30-4a6f-8364-8ccb7c0c9035',
}
