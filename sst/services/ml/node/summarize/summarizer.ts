import {lambdaSend} from "../../../aws/handlers"
import {Function} from "sst/node/function";
import * as S from '@gnothi/schemas'
import {TextsParamsMatch} from "../errors";
import {Config} from 'sst/node/config'
import {v4 as uuid} from 'uuid'
import {sendInsight} from "../utils";
import {getSummary} from '@gnothi/schemas/entries'

// set this if using a model that can handle long text, like LongT5. When using long models, we don't necessarily
// need to split text into chunks, and in the accuracy is better when we don't.
const COMBINE_PARAS = true

interface Params {
  summarize?: {
    min_length: number
    max_length: number
  }
  // https://github.com/MaartenGr/KeyBERT
  keywords?: {
    keyphrase_ngram_range?: [number, number]
    stop_words?: "english"

    use_mmr?: boolean, // true
    diversity?: number, // 0.7

    use_maxsum?: boolean, // True,
    nr_candidates?: number // 20,
    top_n?: number
  }
  emotion?: boolean
}

export const keywordsDefaults: Params['keywords'] = {
  keyphrase_ngram_range: [1, 1],
  stop_words: "english",
  use_mmr: true,
  diversity: .10
}

interface FnIn {
  texts: string[]
  params: Params[]
}
type LambdaIn = {
  data: Array<{
    text: string,
    params: Params
  }>
}
export type SummarizeOut = {
  summary: string
  keywords: string[]
  emotion: string
}
type LambdaOut = Array<SummarizeOut>
type FnOut = LambdaOut


async function summarize_({data}: LambdaIn): Promise<LambdaOut> {
  // Get fnName while inside function because will only be present for FnBackground (not FnMain)
  const fnName = Config.FN_SUMMARIZE_NAME
  const res = await lambdaSend<LambdaOut>(data, fnName, "RequestResponse")
  return res.Payload
}

export async function summarize({texts, params}: FnIn): Promise<FnOut> {
  if (params.length === 1) {
    return summarize_({
      data: [{
        text: texts.join('\n'),
        params: params[0]
      }]
    })
  } else if (texts.length === params.length && params.length > 0) {
    const data = texts.map((text, i) => ({
      text,
      params: params[i]
    }))
    return summarize_({data})
  }
}

/**
 * Helper function for summarize on insights page
 */
interface SummarizeInsights {
  entries: S.Entries.Entry[]
  context: S.Api.FnContext
}
export async function summarizeInsights({context, entries}: SummarizeInsights): Promise<FnOut> {
  let summaries: FnOut
  if (entries.length === 0) {
    summaries = []
  } else if (entries.length === 1) {
    // just use summary
    summaries = [{
      summary: entries[0].ai_text,
      keywords: entries[0].ai_keywords,
      emotion: entries[0].ai_sentiment
    }]
  } else {
    summaries = await summarize({
      // summarize summaries, NOT full originals (to reduce token max)
      texts: [entries.map(getSummary).join('\n')],
      params: [{
        summarize: {min_length: 10, max_length: 60},
        keywords: keywordsDefaults,
        emotion: true
      }],
    })
  }
  await sendInsight(
    S.Routes.routes.insights_summarize_response,
    summaries[0],
    context
  )
  return summaries
}


/**
 * Helper function just for summarizing entries on submit
 */

export interface SummarizeEntryIn {
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

const paramsExtra = {keywords: keywordsDefaults, emotion: true}
const params = {
  title: {summarize: {min_length: 3, max_length: 15}},
  para: {summarize: {min_length: 15, max_length: 50}},
  text: {summarize: {min_length: 40, max_length: 120}, ...paramsExtra},
  extra: paramsExtra
}

export async function summarizeEntry({text, paras}: SummarizeEntryIn): Promise<SummarizeEntryOut> {
  // This shouldn't happen, but I haven't tested to ensure
  if (paras.length === 0) {
    throw "paras.length === 0, investigate"
  }

  if (COMBINE_PARAS || paras.length === 1) {
    // The entry was a single paragraph. Don't bother with paragraph magic, just summarize wam-bam
    const joined = paras.join('\n')
    const [title, body] = await summarize({
      texts: [joined, joined],
      params: [params.title, params.text],
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
    texts: paras,
    params: [params.para],
  })).map(p => p.summary)
  const joined = sumParas.join(' ')
  const [title, body] = await summarize({
    texts: [joined, joined],
    params: [params.title, params.text],
  })
  return {
    title: title.summary,
    paras: sumParas,
    body: {
      text: body.summary,
      emotion: body.emotion,
      keywords: body.keywords
    }
  }
}
