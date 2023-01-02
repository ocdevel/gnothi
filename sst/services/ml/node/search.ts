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
  entry_ids: string[]
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
type FnOut = LambdaOut
export async function search({user_id, entry_ids, query, context}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for fn_background (not fn_main)
  const fnName = Config.fn_store_name
  const {Payload} = await lambdaSend<LambdaOut>(
    {
      event: "search",
      data: {
        query,
        user_id,
        entry_ids,
        search_threshold: .6,
        community_threshold: .75
      }
    },
    fnName,
    "RequestResponse"
  )
  const res = Payload
  if (context?.connectionId) {
    const ids = query?.length ? res.ids : entry_ids
    await context.handleRes(
      r.insights_search_response,
      { data: ids.map(id => ({id})) },
      context
    )
  }
  return res
}
