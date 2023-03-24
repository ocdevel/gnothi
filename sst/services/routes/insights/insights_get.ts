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
import {Insights} from '../../data/models/insights'
import * as M from "../../data/models";

const r = S.Routes.routes

r.insights_get_request.fn = r.insights_get_request.fnDef.implement(async (req, context) => {
  return [req]
})

r.insights_get_response.fn = r.insights_get_response.fnDef.implement(async (req, context) => {
  const mEntries = new M.Entries(context.user.id)
  const user_id = context.user.id
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
    const entries = await mEntries.getByIds(ids)

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
