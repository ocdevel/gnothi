import {lambdaSend} from "../aws/handlers"
import {Function} from "@serverless-stack/node/function";
import {TextsParamsMatch} from "./errors";

interface Params {
  summarize?: {
    min_length: number
    max_length: number
  }
  keywords?: {
    top_n: number
  }
  emotion?: boolean
}
interface FnIn {
  texts: [string, ...string[]]
  params: [Params, ...Params[]]
}
type LambdaIn = Array<{
  text: string,
  params: Params
}>
type LambdaOut = Array<{
  summary: string
  keywords: string[]
  emotion: string
}>
type FnOut = LambdaOut
export async function summarize({texts, params}: FnIn): Promise<FnOut> {
  // Get functionNames in here so we don't throw error when this file is imported
  // from proxy.ts
  const functionName = process.env.fn_summarize

  async function call(data: LambdaIn): Promise<LambdaOut> {
    const res = await lambdaSend<LambdaOut>(data, functionName, "RequestResponse")
    return res.Payload
  }

  if (params.length === 1) {
    return call([{
      text: texts.join('\n\n'),
      params: params[0]
    }])
  }

  if (texts.length === params.length) {
    return call(texts.map((text, i) => ({
      text,
      params: params[i]
    })))
  }

  throw new TextsParamsMatch()
}
