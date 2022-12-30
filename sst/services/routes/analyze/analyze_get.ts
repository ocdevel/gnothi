import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {v4 as uuid} from 'uuid'
import {completion} from '../../ml/node/openai'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {analyze_get_request, analyze_ask_response, analyze_themes_response, analyze_summarize_response} from '@gnothi/schemas/analyze'
import {summarize, summarizeAnalyze} from '../../ml/node/summarize'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {Analyze} from '../../data/models/analyze'

const r = S.Routes.routes

r.analyze_get_request.fn = r.analyze_get_request.fnDef.implement(async (req, context) => {
  return [req]
})

r.analyze_get_response.fn = r.analyze_get_response.fnDef.implement(async (req, context) => {
  const analyze = new Analyze(context.user.id)
  const user_id = context.user.id
  const query = req.search
  const promises = []
  const hardFiltered = await analyze.facetFilter(req)
  const {ids, entries, search_mean, clusters} = await search({
    context,
    user_id,
    entries: hardFiltered,
    query
  })

  promises.push(
    ask({
      context,
      query,
      user_id,
      // only send the top few matching documents. Ease the burden on QA ML, and
      // ensure best relevance from embedding-match
      entry_ids: ids.slice(0, 1)
    })
  )

  promises.push(
    books({
      context,
      search_mean
    })
  )

  // summarize summaries, NOT full originals (to reduce token max)
  promises.push(
    summarizeAnalyze({
      context,
      texts: [entries.map(e => e.ai_text || e.text).join('\n\n')],
      params: [{
        summarize: {min_length: 150, max_length: 300},
        keywords: {top_n: 5},
        emotion: true
      }]
    })
  )

  // Promise
  promises.push(
    themes({
      context,
      clusters,
      entries
    })
  )

  await Promise.all(promises)
  return [{done: true}]
})
