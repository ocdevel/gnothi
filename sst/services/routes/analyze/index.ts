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
import {summarize} from '../../ml/summarize'
import {search} from '../../ml/search'
import {themes} from '../../ml/themes'

const r = S.Routes.routes

async function facetFilter(req: analyze_get_request, user_id: string): Promise<Entry[]> {
  const {tags, startDate, endDate, search} = req
  const tids = _reduce(tags, (m,v,k) => {
    if (!v) {return m}
    return [...m, k]
  }, [])
  if (!tids.length) {
    throw new GnothiError({key: "NO_TAGS"})
  }
  const [tids_placeholder, tids_params] = db.arrayValueFix(tids)
  const endDate_ = (endDate === "now" || !endDate) ? dayjs().add(1, "day").toDate() : endDate
  const entries = await db.executeStatement({
    sql: `
      select e.*
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = :user_id
        and e.created_at > :startDate::date
        and e.created_at <= :endDate::date
        and et.tag_id in (${tids_placeholder})
      group by e.id
      order by e.created_at asc;
    `,
    parameters: [
      {name: "user_id", value: {stringValue: user_id}, typeHint: "UUID"},
      {name: "startDate", value: {stringValue: startDate}},
      {name: "endDate", value: {stringValue: endDate_}},
      ...tids_params
    ]
  })
  return entries
}

r.analyze_get_request.fn = r.analyze_get_request.fnDef.implement(async (req, context) => {
  return [req]
})

r.analyze_get_response.fn = r.analyze_get_response.fnDef.implement(async (req, context) => {
  const {handleRes} = context
  const hardFiltered = await facetFilter(req, context.user.id)
  const {answer, entries} = await search(hardFiltered, req.search)

  // TODO send filtered results. Maybe analyze_filtered_response with just eids; and the client uses to apply filter

  const pAsk = (async function() {
    if (!answer?.length) {return null}
    return handleRes(
      r.analyze_ask_response,
      {
        data: [{
          id: uuid(), // neede for React `key`
          answer
        }]
      },
      context
    )
  })()

  const pSummarize = summarize({
    texts: [entries.map(e => e.text).join('\n\n')],
    params: [{
      summarize: {min_length: 150, max_length: 300},
      keywords: {top_n: 5},
      emotion: true
    }]
  }).then((summary) => {
      handleRes(
        r.analyze_summarize_response,
        {
          data: [{
            id: uuid(), // neede for React `key`,
            ...summary[0]
          }]
        },
        context
      )
    })

  // Promise
  const pThemes = themes(entries).then(res => {
    handleRes(
      r.analyze_themes_response,
      {
        data: res.map((r, i) => ({
          id: uuid(), // neede for React `key`
          ...r
        }))
      },
      context
    )
  })

  const final = await Promise.all([pAsk, pSummarize, pThemes])
  return [{done: true}]
})
