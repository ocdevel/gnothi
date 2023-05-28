import {lambdaSend} from "../../aws/handlers"
import {Config} from 'sst/node/config'
import * as S from '@gnothi/schemas'
import {v4 as uuid} from 'uuid'
import {sendInsight} from "./utils";

type FnIn = {
  context?: S.Api.FnContext
  query: string
  user_id: string
  entry_ids: string[]
  usePrompt: boolean
}
type LambdaIn = FnIn
type LambdaOut = {
  answer: string
}
type FnOut = LambdaOut

export async function ask({user_id, entry_ids, query, context}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for FnBackground (not FnMain)
  const fnName = Config.FN_ASK_NAME
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
      await sendInsight(
        S.Routes.routes.insights_ask_response,
        Payload,
        context
      )
    }
  }
  return Payload
}
