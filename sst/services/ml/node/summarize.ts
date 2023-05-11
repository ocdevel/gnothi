import {lambdaSend} from "../../aws/handlers"
import {Function} from "@serverless-stack/node/function";
import * as S from '@gnothi/schemas'
import {TextsParamsMatch} from "./errors";
import {Config} from '@serverless-stack/node/config'
import {v4 as uuid} from 'uuid'
import {sendInsight} from "./utils";
import {completion} from "./openai";
import {getSummary} from '@gnothi/schemas/entries'

const USE_OPENAI = false

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

/**
 * I've had a hell of a time with huggingface summarizers. They lean too heavily on
 * the training data, and everything sounds like news. I've played with hyperparameters
 * till I'm blue in the face, and I'm giving up for now and using OpenAI TLDR instead.
 */
async function summarizeOpenai(data: LambdaIn[0]): Promise<SummarizeOut> {
  const {params, text} = data

  const summaryPrompt = async () => {
    if (!params.summarize) {return ""}
    return completion({
      prompt: `Summarize this in fewer than ${params.summarize.max_length} words:\n\n${data.text}`,
    })
  }

  const keywordsPrompt = async () => {
    if (!params.keywords) {return []}
    const top_n = params.keywords?.top_n || 3
    return completion({
      prompt: `Extract the ${top_n} most relevant keywords from the following:\n\n${text}`
    }).then(res => res
      // "Keywords: this, that, other thing."
      .replace(/^[kK]eywords[: ]*/, '')
      .replace('\n', ', ')
      .split(/[0-9\n,]+/)
      .map(x => x
        .toLowerCase()
        .replace(/[^a-z() ]/, '')
        .trim())
      .filter(Boolean)
    )
  }

  const emotionsPrompt = async () => {
    if (!params.emotion) {return ""}
    return completion({
      prompt: `Which emotion (anger, disgust, fear, joy, neutral, sadness, surprise) is expressed in this:\n\n${data.text}`
    }).then(txt => txt
      .toLowerCase() // "Sadness."
      .replace('.', '')
    )
  }

  const res = await Promise.all([summaryPrompt(), keywordsPrompt(), emotionsPrompt()])
  const [summary, keywords, emotion] = res
  return {summary, keywords, emotion}
}


async function summarize_(data: LambdaIn): Promise<LambdaOut> {
  if (USE_OPENAI) {
    return Promise.all(data.map(summarizeOpenai))
  } else {
    // Get fnName while inside function because will only be present for fn_background (not fn_main)
    const fnName = Config.fn_summarize_name
    const res = await lambdaSend<LambdaOut>(data, fnName, "RequestResponse")
    return res.Payload
  }

}

export async function summarize({texts, params}: FnIn): Promise<FnOut> {
  if (params.length === 1) {
    return summarize_([{
      text: texts.join('\n'),
      params: params[0]
    }])
  } else if (texts.length === params.length && params.length > 0) {
    return summarize_(texts.map((text, i) => ({
      text,
      params: params[i]
    })))
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
      }]
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

const paramsExtra = {keywords: keywordsDefaults, emotion: true}
const params = {
  title: {summarize: {min_length: 3, max_length: 15}},
  para: {summarize: {min_length: 15, max_length: 50}},
  text: {summarize: {min_length: 40, max_length: 120}, ...paramsExtra},
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
  const [title, body] = await summarize({
    texts: [joined, joined],
    params: [params.title, params.text]
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
