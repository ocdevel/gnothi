import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {analyze_get_request, analyze_ask_response, analyze_themes_response, analyze_summarize_response} from '@gnothi/schemas/analyze'
import {Function} from "@serverless-stack/node/function"
import {lambdaSend} from "../../aws/handlers"

const r = S.Routes.routes

const fnSearch = Function.fn_search.functionName
const fnSummarize = Function.fn_summarize.functionName
const fnKeywords = Function.fn_keywords.functionName

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

interface SearchResponse {
  answer?: string
  ids: string[]
}
interface SearchResults {
  answer?: string
  entries: Entry[]
}
async function getSearch(req: analyze_get_request, entries: Entry[]): Promise<SearchResults> {
  if (!req.search?.length) {
    return {entries}
  }
  const res = (await lambdaSend<SearchResponse>(
    {ids: entries.map(e => e.id), query: req.search},
    fnSearch,
    "RequestResponse"
  )).Payload
  const filteredEntries = entries.filter(e => ~res.ids.indexOf(e.id))
  return {answer: res.answer, entries: filteredEntries}
}

async function getSummary(text: string, params: object): Promise<string> {
  const res = await lambdaSend(
    {text, params},
    fnSummarize,
    "RequestResponse"
  )
  return res.Payload
}

interface ClusterResponse {
  titles: string
  blob: string
}
async function getClusters(ids: string[]): Promise<ClusterResponse[]> {
  // TODO call weaviate directly
  return []
}

async function getKeywords(text: string) {
  return (await lambdaSend<[string, number][]>(
    {text, params: {top_n: 5}},
    fnKeywords,
    "RequestResponse"
  )).Payload
}

type ThemeResult = {
  keywords: [string, number][]
  summary: string
}
async function getThemes(entries: Entry[]): Promise<ThemeResult[]> {
  const clusters = await getClusters(entries.map(e => e.id))
  return Promise.all<ThemeResult[]>(clusters.map(async (c) => ({
    keywords: await getKeywords(c.blob),
    summary: await getSummary(c.blob, {min_length: 50, max_length: 150})
  })))
}

r.analyze_get_request.fn = r.analyze_get_request.fnDef.implement(async (req, context) => {
  const {handleRes} = context
  const hardFiltered = await facetFilter(req, context.user.id)
  const {answer, entries} = await getSearch(req, hardFiltered)

  // TODO send filtered results. Maybe analyze_filtered_response with just eids; and the client uses to apply filter

  const ask = !answer?.length ? new Promise(resolve => resolve(undefined))
    : handleRes(
      r.analyze_ask_response,
      {event: 'analyze_ask_response', error: false, code: 200, data: [{id: 'x', answer}]},
      context
    )

  const blob = entries.map(e => e.text).join('\n\n')

  // Promise
  const summary = getSummary(blob, {min_length: 150, max_length: 300}).then((summary) => {
    handleRes(
      r.analyze_summarize_response,
      {event: 'analyze_summarize_response', error: false, code: 200, data: [{id: 'x', summary}]},
      context
    )
  })

  // Promise
  const themes = getThemes(entries).then(themes => {
    console.log({themes})
  })

  const res = await Promise.all([ask, summary, themes])
  debugger
  return [{done: true}]
})
