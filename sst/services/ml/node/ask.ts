import {lambdaSend} from "../../aws/handlers"
import {Config} from '@serverless-stack/node/config'
import * as S from '@gnothi/schemas'
import {v4 as uuid} from 'uuid'

type FnIn = {
  context?: S.Api.FnContext
  query: string
  user_id: string
  entry_ids: string[]
}
type LambdaIn = FnIn
type LambdaOut = {
  answer: string
}
type FnOut = LambdaOut

export async function ask({user_id, entry_ids, query, context}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for fn_background (not fn_main)
  const fnName = Config.fn_ask_name
  const {Payload} = await lambdaSend<LambdaOut>(
    {
      query,
      user_id,
      entry_ids
    },
    fnName,
    "RequestResponse"
  )
  if (context?.connectionId) {
    // it will return {answer: ""} anyway
    if (Payload.answer?.length) {
      await context.handleRes(
        S.Routes.routes.analyze_ask_response,
        {data: [{id: uuid(), answer: Payload.answer}]},
        context
      )
    }
  }
  return Payload
}
