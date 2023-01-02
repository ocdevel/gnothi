import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import * as M from '../../data/models'
import {Insights} from "../../data/models";
import {search} from "../../ml/node/search";
import {ask} from "../../ml/node/ask";
import {books} from "../../ml/node/books";
import {summarizeInsights} from "../../ml/node/summarize";
import {themes} from "../../ml/node/themes";
const r = S.Routes.routes

r.entries_list_request.fn = r.entries_list_request.fnDef.implement(async (req, context) => {
  return [req]
})

r.entries_list_response.fn = r.entries_list_response.fnDef.implement(async (req, context) => {
  const mEntries = new M.Entries(context.user.id)
  const user_id = context.user.id
  const query = req.search
  const promises = []
  const filtered = await mEntries.filter(req)

  // Send filtered results right away. Eg, on page-load get all entries without search-filtered
  promises.push(context.handleRes(
    r.entries_list_filtered,
    {data: filtered},
    context
  ))

  // Then run search, which will further filter the results
  const {ids, entries, search_mean, clusters} = await search({
    context,
    user_id,
    entries: filtered.map(f => f.entry),
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
    summarizeInsights({
      context,
      texts: [entries.map(e => e.ai_text || e.text).join('\n')],
      params: [{
        summarize: {min_length: 40, max_length: 120},
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
