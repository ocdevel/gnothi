import {lambdaSend} from "../../aws/handlers"
import {Function} from "@serverless-stack/node/function";
import {TextsParamsMatch} from "./errors";
import {Config} from '@serverless-stack/node/config'
const fnName = Config.fn_summarize_name

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
  async function call(data: LambdaIn): Promise<LambdaOut> {
    const res = await lambdaSend<LambdaOut>(data, fnName, "RequestResponse")
    return res.Payload
  }

  if (params.length === 1) {
    return call([{
      text: texts.join('\n\n'),
      params: params[0]
    }])
  }

  if (texts.length === params.length && params.length > 0) {
    return call(texts.map((text, i) => ({
      text,
      params: params[i]
    })))
  }

  throw new TextsParamsMatch()
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
  para: {summarize: {min_length: 10, max_length: 100}},
  text: {summarize: {min_length: 10, max_length: 300}, ...paramsExtra},
  extra: paramsExtra
}

export async function summarizeEntry(clean: SummarizeEntryIn): Promise<SummarizeEntryOut> {
  // This shouldn't happen, but I haven't tested to ensure
  if (clean.paras.length === 0) {
    throw "paras.length === 0, investigate"
  }

  if (clean.paras.length === 1) {
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
  const joined = sumParas.join('\n')
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
