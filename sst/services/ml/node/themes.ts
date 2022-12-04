import {lambdaSend} from "../../aws/handlers"
import {Function} from "@serverless-stack/node/function";
import {TextsParamsMatch} from "./errors";

interface ClusterResponse {
  titles: string
  blob: string
}
async function getClusters(ids: string[]): Promise<ClusterResponse[]> {
  // TODO call weaviate directly
  return []
}
type ThemeResult = {
  keywords: [string, number][]
  summary: string
}
async function getThemes(entries: Entry[]): Promise<ThemeResult[]> {
  const clusters = await getClusters(entries.map(e => e.id))
  return Promise.all<ThemeResult[]>(clusters.map(async (c) => ({
    keywords: await getKeywords(c.blob),
    summary: await getSummary(c.blob, {min_length: 50, max_length: 150})
  })))
}













interface Params {
  top_n: number
}
interface FnIn {
  texts: [string, ...string[]]
  params: [Params, ...Params[]]
}
type LambdaIn = {text: string, params: Params}[]
type LambdaOut = string[]
type FnOut = string[]
export async function themes({texts, params}: FnIn): Promise<FnOut> {
  // Get functionNames in here so we don't throw error when this file is imported
  // from proxy.ts
  const functionName = Function.fn_keywords.functionName

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
