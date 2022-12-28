import {lambdaSend} from "../../aws/handlers"
import {Config} from '@serverless-stack/node/config'
const fnName = Config.fn_ask_name

type FnIn = {
  query: string
  user_id: string
  entry_ids: string[]
}
type LambdaIn = FnIn
type LambdaOut = {
  answer: string
}
type FnOut = LambdaOut

export async function ask({user_id, entry_ids, query}: FnIn): Promise<FnOut> {

  const res = await lambdaSend<LambdaOut>(
    {
      query,
      user_id,
      entry_ids
    },
    fnName,
    "RequestResponse"
  )
  return res.Payload
}
