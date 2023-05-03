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
import {summarize, summarizeInsights} from '../../ml/node/summarize'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {getParas, getSummary, getText} from '@gnothi/schemas/entries'
import {Insights} from '../../data/models/insights'
import {Route} from '../types'
import {ulid} from "ulid";
import {inArray, eq, and} from "drizzle-orm/expressions";

const r = S.Routes.routes

export const insights_get_request = new Route(r.insights_get_request,async (req, context) => {
  // TODO check if any entry_ids correspond to entries not yet indexed, and remove from entry_ids if so
  return [req]
})

export const insights_get_response = new Route(r.insights_get_response,async (req, context) => {
  const {m, uid} = context
  const user_id = uid
  const promises = []
  const {insights, entry_ids, view} = req
  const {query} = insights
  // will be used to pair to which page called the insights client-side (eg list vs view)
  context.requestId = req.view

  // Then run search, which will further filter the results
  const {ids, search_mean, clusters} = await search({
    context,
    user_id,
    entry_ids,
    query
  })

  if (query?.length) {
    promises.push(ask({
      context,
      query,
      user_id,
      // only send the top few matching documents. Ease the burden on QA ML, and
      // ensure best relevance from embedding-match
      entry_ids: ids.slice(0, 1)
    }))
  }

  if (insights.books) {
    promises.push(books({
      context,
      search_mean
    }))
  }

  if (insights.summarize) {
    const entries = await m.entries.getByIds(ids)

    promises.push(summarizeInsights({
      context,
      entries
    }))

    // Themes
    promises.push(themes({
      context,
      clusters,
      entries
    }))

  }

  await Promise.all(promises)
  return [{view, done: true}]
})


export const insights_prompt_request = new Route(r.insights_prompt_request,async (req, context) => {
  const mInsights = context.m.insights
  const entries = await mInsights.entriesByIds(req.entry_ids)
  const {prompt, view} = req

  const placeholder = {
    entry: !!~prompt.indexOf('<entry>'),
    paragraphs: !!~prompt.indexOf('<paragraphs>'),
    summary: !!~prompt.indexOf('<summary>'),
  }
  const hasMultiple = Object.values(placeholder).filter(Boolean).length > 1
  if (hasMultiple) {
    throw new GnothiError({message: "Only one placeholder can be used at a time for now. This many change later."})
  }

  let response: string
  if (placeholder.paragraphs) {
    if (view === 'list') {
      throw new GnothiError({message: "Can't yet use <paragraphs> in list view. When implemented, it will operate on themes."})
    }
    const paras = getParas(entries[0])
    response = (await Promise.all(paras.map(async (p, i) => {
      const completion_ = await completion({
        prompt: prompt.replace("<paragraphs>", p),
      })
      return `Paragraph ${i}: ${completion_}`
    }))).join('\n\n')
  } else {
    const texts = placeholder.summary ? entries.map(getSummary) : entries.map(getText)
    const text = texts.join('\n')
    response = await completion({
      // entry v summary handled above, so just replace either/or here
      prompt: prompt.replace("<entry>", text)
        .replace("<summary>", text)
    })
  }

  return [{
    id: ulid(),
    view: req.view,
    response
  }]
})
