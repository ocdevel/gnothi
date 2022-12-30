import {lambdaSend} from "../../aws/handlers"
import {analyze_books_response} from '@gnothi/schemas/analyze'
import {Config} from '@serverless-stack/node/config'
import * as S from "@gnothi/schemas"

type FnIn = {
  context?: S.Api.FnContext
  search_mean: number[]
}
type LambdaIn = FnIn
type LambdaOut = analyze_books_response[]
type FnOut = LambdaOut

export async function books({search_mean, context}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for fn_background (not fn_main)
  const fnName = Config.fn_books_name
  let res: LambdaOut
  if (!search_mean?.length) {
    res = []
  } else {
    const {Payload} = await lambdaSend<LambdaOut>(
      {embedding: search_mean},
      fnName,
      "RequestResponse"
    )
    res = Payload
  }
  if (context?.connectionId) {
    await context.handleRes(
      S.Routes.routes.analyze_books_response,
      {data: res},
      context
    )
  }
  return res
}
