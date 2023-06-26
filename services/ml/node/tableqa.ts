import {lambdaSend} from "../../aws/handlers"
import {Config} from 'sst/node/config'

type FnIn = {
  query: string
  user_id: string
}
type LambdaIn = FnIn
type LambdaOut = {
  answer: string
}
type FnOut = LambdaOut

export async function ask({user_id, query}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for FnBackground (not FnMain)
  const fnName = Config.FN_BEHAVIORS_NAME
  const {Payload} = await lambdaSend<LambdaOut>(
    {
      query,
      user_id,
    },
    fnName,
    "RequestResponse"
  )
  return Payload
}
