import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {v4 as uuid} from 'uuid'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {analyze_get_request, analyze_ask_response, analyze_themes_response, analyze_summarize_response} from '@gnothi/schemas/analyze'
import {summarize} from '../../ml/node/summarize'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'

const r = S.Routes.routes

async function facetFilter(req: analyze_get_request, user_id: string): Promise<Entry[]> {
  const {tags, startDate, endDate, search} = req
  const tids = boolMapToKeys(tags)
  if (!tids.length) {
    throw new GnothiError({key: "NO_TAGS"})
  }
  const endDate_ = (endDate === "now" || !endDate) ? dayjs().add(1, "day").toDate() : endDate
  const entries = await db.executeStatement({
    sql: `
      select e.*
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = :user_id
        and e.created_at > :startDate::date
        and e.created_at <= :endDate::date
        and et.tag_id in :tids
      group by e.id
      order by e.created_at asc;
    `,
    parameters: [
      {name: "user_id", value: {stringValue: user_id}, typeHint: "UUID"},
      {name: "startDate", value: {stringValue: startDate}},
      {name: "endDate", value: {stringValue: endDate_}},
      {name: "tids", typeHint: "UUID", value: {arrayValue: {stringValues: tids}}}
    ]
  })
  return entries
}

r.analyze_get_request.fn = r.analyze_get_request.fnDef.implement(async (req, context) => {
  return [req]
})

r.analyze_get_response.fn = r.analyze_get_response.fnDef.implement(async (req, context) => {
  const user_id = context.user.id
  const query = req.search
  const {handleRes} = context
  const hardFiltered = await facetFilter(req, user_id)
  const {ids, entries, search_mean, clusters} = await search({
    user_id,
    entries: hardFiltered,
    query
  })

  // client needs 'id' for React 'key'
  function wrapRes(res: any) {
    const data = Array.isArray(res)
      ? res.map(r => ({id: uuid(), ...r}))
      : {id: uuid(), ...res}
    return { data }
  }

  const pSearch = handleRes(
    r.analyze_search_response,
    wrapRes(ids.map(id => ({id}))),
    context
  )

  const pAsk = ask({
    query,
    user_id,
    // only send the top few matching documents. Ease the burden on QA ML, and
    // ensure best relevance from embedding-match
    entry_ids: ids.slice(0, 1)
  }).then(res => {
    // it will return {answer: ""} anyway
    if (!res.answer?.length) {return}
    handleRes(
      r.analyze_ask_response,
      wrapRes(res),
      context
    )
  })

  const pBooks = books({
    search_mean
  }).then(res => handleRes(
    r.analyze_books_response,
    wrapRes(res),
    context
  ))

  // summarize summaries, NOT full originals (to reduce token max)
  const pSummarize = summarize({
    texts: [entries.map(e => e.ai_text || e.text).join('\n\n')],
    params: [{
      summarize: {min_length: 150, max_length: 300},
      keywords: {top_n: 5},
      emotion: true
    }]
  }).then((summary) => {
      handleRes(
        r.analyze_summarize_response,
        wrapRes(summary[0]),
        context
      )
    })

  // Promise
  const pThemes = themes({
    clusters,
    entries
  }).then(res => {
    handleRes(
      r.analyze_themes_response,
      wrapRes(res),
      context
    )
  })

  const final = await Promise.all([pSearch, pAsk, pSummarize, pBooks, pThemes])
  return [{done: true}]
})
