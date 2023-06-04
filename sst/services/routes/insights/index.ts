import * as S from '@gnothi/schemas'
import {GnothiError} from "../errors";
import {v4 as uuid} from 'uuid'
import {completion} from '../../ml/node/openai'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {insights_ask_response, insights_themes_response, insights_summarize_response} from '@gnothi/schemas/insights'
import {summarize, summarizeInsights} from '../../ml/node/summarize/summarizer'
import {summarizeInsights as summarizeInsightsOpenai} from '../../ml/node/summarize/openai'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {getParas, getSummary, getText} from '@gnothi/schemas/entries'
import {Insights} from '../../data/models/insights'
import {Route} from '../types'
import {ulid} from "ulid";
import {inArray, eq, and} from "drizzle-orm";

const r = S.Routes.routes

export const insights_get_request = new Route(r.insights_get_request,async (req, context) => {
  // TODO check if any entry_ids correspond to entries not yet indexed, and remove from entry_ids if so
  return [req]
})

export const insights_get_response = new Route(r.insights_get_response,async (req, context) => {
  const {m, uid: user_id} = context
  const {view, entry_ids, insights} = req
  const {query} = insights
  const promises = []
  // will be used to pair to which page called the insights client-side (eg list vs view)
  context.requestId = view
  const usePrompt = Boolean(context.user.premium)

  const entriesAll = await m.entries.getByIds(entry_ids)
  const entriesHash = Object.fromEntries(entriesAll.map(e => [e.id, e]))

  // Then run search, which will further filter the results
  const {idsFiltered, idsFromVectorSearch, search_mean, clusters} = await search({
    context,
    user_id,
    entries: entriesAll,
    query,
    usePrompt
  })
  const entriesFiltered = idsFiltered.map(id => entriesHash[id])

  if (query?.length) {
    promises.push(ask({
      context,
      query,
      user_id,
      usePrompt,
      // only send the top few matching documents. Ease the burden on QA ML, and
      // ensure best relevance from embedding-match
      entry_ids: idsFromVectorSearch.slice(0, 1)
    }))
  }

  if (insights.books) {
    promises.push(books({
      context,
      usePrompt,
      search_mean
    }))
  }

  if (insights.summarize) {
    if (usePrompt) {
      promises.push(summarizeInsightsOpenai({
        context,
        entries: entriesFiltered
      }))
    } else {
      promises.push(summarizeInsights({
        context,
        entries: entriesFiltered
      }))

      // Themes
      promises.push(themes({
        context,
        clusters,
        entries: entriesFiltered
      }))
    }
  }

  if (insights.summarize) {

  }

  await Promise.all(promises)
  return [{view, done: true}]
})


export const insights_prompt_request = new Route(r.insights_prompt_request,async (req, context) => {
  const mInsights = context.m.insights
  const entries = await mInsights.entriesByIds(req.entry_ids)
  const {prompt, view} = req


  const texts = entries.length > 1 ? entries.map(getSummary) : entries.map(getText)
  const text = texts.join('\n')
  const response = await completion({
    // entry v summary handled above, so just replace either/or here
    model: "gpt-4",
    max_tokens: 512,
    prompt: prompt.replace("<journal>", text)
  })

  return [{
    id: ulid(),
    view: req.view,
    response
  }]
})
