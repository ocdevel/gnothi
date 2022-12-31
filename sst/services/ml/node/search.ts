import {lambdaSend} from "../../aws/handlers"
import * as S from '@gnothi/schemas'
import {insights_books_response} from '@gnothi/schemas/insights'
import {Config} from '@serverless-stack/node/config'
import {v4 as uuid} from 'uuid'

const r = S.Routes.routes

type FnIn = {
  context?: S.Api.FnContext
  query: string
  user_id: string
  entries: S.Entries.Entry[]
}
type LambdaIn = {
  event: "search"
  data: {
    query: string
    entry_ids: string[]
    user_id: string
  }
}
type LambdaOut = {
  ids: string[]
  clusters: string[][]
  search_mean: number[]
}
type FnOut = LambdaOut & {
  entries: S.Entries.Entry[]
}
export async function search({user_id, entries, query, context}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for fn_background (not fn_main)
  const fnName = Config.fn_store_name
  const {Payload} = await lambdaSend<LambdaOut>(
    {
      event: "search",
      data: {
        query,
        user_id,
        entry_ids: entries.map(e => e.id),
        search_threshold: .6,
        community_threshold: .75
      }
    },
    fnName,
    "RequestResponse"
  )
  const res = {
    ...Payload,
    entries: entries.filter(e => ~Payload.ids.indexOf(e.id))
  }
  if (context?.connectionId) {
    const ids = res.ids.map(id => ({id}))
    await context.handleRes(
      r.insights_search_response,
      {data: ids},
      context
    )
  }
  return res
}
