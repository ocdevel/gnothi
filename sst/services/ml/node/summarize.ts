import {lambdaSend} from "../../aws/handlers"
import {Function} from "@serverless-stack/node/function";
import * as S from '@gnothi/schemas'
import {TextsParamsMatch} from "./errors";
import {Config} from '@serverless-stack/node/config'
import {v4 as uuid} from 'uuid'

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
  texts: string[]
  params: Params[]
}
type LambdaIn = Array<{
  text: string,
  params: Params
}>
export type SummarizeOut = {
  summary: string
  keywords: string[]
  emotion: string
}
type LambdaOut = Array<SummarizeOut>
type FnOut = LambdaOut
export async function summarize({texts, params}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for fn_background (not fn_main)
  const fnName = Config.fn_summarize_name
  async function call(data: LambdaIn): Promise<LambdaOut> {
    const res = await lambdaSend<LambdaOut>(data, fnName, "RequestResponse")
    return res.Payload
  }

  if (params.length === 1) {
    return call([{
      text: texts.join('\n'),
      params: params[0]
    }])
  } else if (texts.length === params.length && params.length > 0) {
    return call(texts.map((text, i) => ({
      text,
      params: params[i]
    })))
  }
}

/**
 * Helper function for summarize on insights page
 */
type SummarizeInsights = FnIn & {context?: S.Api.FnContext}
export async function summarizeInsights({context, ...rest}: SummarizeInsights): Promise<FnOut> {
  const summary = await summarize(rest)
  if (context?.connectionId) {
    await context.handleRes(
      S.Routes.routes.insights_summarize_response,
      {data: summary.map(s => ({id: uuid(), ...s}))},
      context
    )
  }
  return summary
}


/**
 * Helper function just for summarizing entries on submit
 */

interface SummarizeEntryIn {
  text: string
  paras: string[]
}
export interface SummarizeEntryOut {
  title: string
  paras: string[]
  body: {
    text: string
    emotion: string
    keywords: string[]
  }
}

const paramsExtra = {keywords: {top_n: 5}, emotion: true}
const params = {
  title: {summarize: {min_length: 5, max_length: 15}},
  para: {summarize: {min_length: 15, max_length: 60}},
  text: {summarize: {min_length: 40, max_length: 150}, ...paramsExtra},
  extra: paramsExtra
}

export async function summarizeEntry(clean: SummarizeEntryIn): Promise<SummarizeEntryOut> {
  // This shouldn't happen, but I haven't tested to ensure
  if (clean.paras.length === 0) {
    throw "paras.length === 0, investigate"
  }

  if (clean.paras.length === 1) {
  // Currently using 16384 model, so we can summarize the whole thing. Revert
  // to "sumParas vs full" version if back to 4096 models
  // if (true) {
    // The entry was a single paragraph. Don't bother with paragraph magic, just summarize wam-bam
    const joined = clean.paras.join('\n')
    const [title, body] = await summarize({
      texts: [joined, joined],
      params: [params.title, params.text]
    })
    return {
      title: title.summary,
      paras: [body.summary],
      body: {
        text: body.summary,
        emotion: body.emotion,
        keywords: body.keywords
      }
    }
  }

  // Multiple paragraphs. Ideal scenario, we can summarize each paragraph then concatenate, which helps us
  // with the max-tokens for summarization thing
  const sumParas = (await summarize({
    texts: clean.paras,
    params: [params.para]
  })).map(p => p.summary)
  const joined = sumParas.join(' ')
  const [title, extra] = await summarize({
    texts: [joined, joined],
    params: [params.title, params.extra]
  })
  return {
    title: title.summary,
    paras: sumParas,
    body: {
      text: joined,
      emotion: extra.emotion,
      keywords: extra.keywords
    }
  }
}
