import {lambdaSend} from "../../aws/handlers"
import {analyze_books_response} from '@gnothi/schemas/analyze'
import {Config} from '@serverless-stack/node/config'
const fnName = Config.fn_books_name

type FnIn = {
  search_mean: number[]
}
type LambdaIn = FnIn
type LambdaOut = {
  books: analyze_books_response[]
}
type FnOut = LambdaOut

export async function books({search_mean}: FnIn): Promise<FnOut> {
  if (!search_mean?.length) {
    return {books: []}
  }
  const res = await lambdaSend<LambdaOut>(
    {embedding: search_mean},
    fnName,
    "RequestResponse"
  )
  return res.Payload
}
