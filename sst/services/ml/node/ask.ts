import {lambdaSend} from "../../aws/handlers"

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
    process.env.fn_ask,
    "RequestResponse"
  )
  return res.Payload
}
