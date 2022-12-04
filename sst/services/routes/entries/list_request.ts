import * as S from '@gnothi/schemas'
import {db} from '../../data/db'
import {GnothiError} from "../errors";
import {z} from 'zod'
import {reduce as _reduce} from "lodash"
import {Function} from "@serverless-stack/node/function"
import {lambdaSend} from '../../aws/handlers'
import {weaviateClient, weaviateDo} from '../../data/weaviate'

const r = S.Routes.routes
const fnSummarize = Function.fn_summarize.functionName
const fnKeywords = Function.fn_keywords.functionName
const fnSearch = Function.fn_search.functionName

r.entries_list_request.fn = r.entries_list_request.fnDef.implement(async (req, context) => {
  const entries = await db.exec({
    sql: `
      select e.*,
             json_agg(et.*) as entries_tags
      from entries e
             inner join entries_tags et on e.id = et.entry_id
      where e.user_id = :user_id
      group by e.id
      order by e.created_at desc;
    `,
    values: {user_id: context.user.id},
    zIn: S.Tags.EntryTag.merge(S.Entries.Entry)
  })
  // TODO update SQL to do this conversion, we'll use it elsewhere
  const withBoolMap = entries.map(entry => ({
    entry,
    tags: _reduce(entry.tags, (m, v) => ({...m, [v.tag_id]: true}), {})
  }))
  return withBoolMap
})
