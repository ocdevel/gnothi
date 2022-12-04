import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {analyze_get_request, analyze_ask_response, analyze_themes_response, analyze_summarize_response} from '@gnothi/schemas/analyze'
import {summarize} from '../../ml/node/summarize'
import {keywords} from '../../ml/node/keywords'
import {search} from '../../ml/node/search'
import {themes} from '../../ml/node/themes'

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
  const {answer, entries} = await search(req.search, hardFiltered)

  // TODO send filtered results. Maybe analyze_filtered_response with just eids; and the client uses to apply filter

  const pAsk = !answer?.length ? new Promise(resolve => resolve(undefined))
    : handleRes(
      r.analyze_ask_response,
      {data: [{id: 'x', answer}]},
      context
    )

  const blob = entries.map(e => e.text).join('\n\n')

  // Promise
  const pSummarize = summarize({
    texts: [blob],
    params: [{min_length: 150, max_length: 300}]
  }).then((summary) => {
      handleRes(
        r.analyze_summarize_response,
        {data: [{id: 'x', summary}]},
        context
      )
    })

  // Promise
  const pThemes = themes(entries).then(themes => {
    console.log({themes})
  })

  const res = await Promise.all([pAsk, pSummarize, pThemes])
  debugger
  return [{done: true}]
})
