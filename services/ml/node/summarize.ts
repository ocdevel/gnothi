import {lambdaSend} from "../../aws/handlers"
import {Function} from "sst/node/function";
import * as S from '@gnothi/schemas'
import {Config} from 'sst/node/config'
import {v4 as uuid} from 'uuid'
import {sendInsight} from "./utils";
import {completion, Prompt, tokenLimits} from "./openai";
import {getSummary} from '@gnothi/schemas/entries'
import {insights_themes_response, SUMMARIZE_DISABLED, SUMMARIZE_EMPTY} from '@gnothi/schemas/insights'
const r = S.Routes.routes
import {FnContext} from '../../routes/types'
import { encode, decode } from 'gpt-token-utils'


type ThemesOut = insights_themes_response['themes']

export interface SummarizeEntryIn {
  text: string
  paras: string[]
  generative: boolean
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

interface FnIn {
  texts: string[]
}
export type FnOut = {
  title: string
  summary: string
  keywords: string[]
  emotion: string
}
type ParsedCompletion = {
  title: string
  summary: string
  emotion: string
  failed?: boolean
  themes: {
    title: string
    keywords: string[]
    summary: string
  }[]
}

const SYSTEM = `Between >>> and <<< the user will provide content, from which you will extract information and respond with JSON. The JSON template should follow the TypeScript definition below. Read the template carefully for what is to be extracted:
\`\`\`\`typescript
{
  title: string // A short headline 
  summary: string //  A summary, highlighting the key points
  emotion: "anger"|"disgust"|"fear"|"joy"|"neutral"|"sadness"|"surprise"
  // 1 to 3 core concepts in the entry. Never provide more than 3 themes
  themes: Array<{
    title: string // A short title for this theme
    summary: string // One sentence summarizing this theme
    keywords: string[] // 1 to 3 keywords or phrases in this theme. Never provide more than 3
  }>
}
\`\`\`
Reply with a valid JSON object.`

// this was generated by GPT, clean it up when I get a chance
function parseCompletion(originalEntry: string, llmOutput: string): ParsedCompletion {
  try {
    return JSON.parse(llmOutput)
  } catch (e) {
    console.error("LLM failed to output valid JSON", {originalEntry, llmOutput})
    return {
      // match up to the first punctuation or new-line
      title: originalEntry.match(/^(.*?)[\n\r,.!?]/)?.[1] || originalEntry,
      summary: originalEntry,
      emotion: "neutral",
      themes: []
    }
  }
}

function squashTexts(lines: string[]): string {
  // join all lines together, and regex replace all \n with space
  return lines.join('\n').replace(/[\n\r]+/g, ' ')
}

/**
 * I've had a hell of a time with huggingface summarizers. They lean too heavily on
 * the training data, and everything sounds like news. I've played with hyperparameters
 * till I'm blue in the face, and I'm giving up for now and using OpenAI TLDR instead.
 */
export async function summarizeOpenai({texts}: FnIn): Promise<ParsedCompletion> {
  // replace all \n with ' ' before master-prompting
  let squashed = squashTexts(texts)

  // Even with any of keywords,emotion,summary disabled; crafting our combinedPrompt over time makes this easier to
  // get right, and we can just remove the results before returning

  // Don't rely on truncateMessages from openai.ts, since we only want to truncate the journal(s)
  const model = "gpt-3.5-turbo-16k"
  const max_tokens = 1024
  const squashedTokens = encode(squashed).tokens
  const lengths = {
    journal: squashedTokens.length,
    max: tokenLimits[model],
    reserved: encode(SYSTEM + ">>> [ENTRY] <<<").tokens.length + max_tokens,
    used: 0
  }
  lengths.used = lengths.journal + lengths.reserved
  if (lengths.used > lengths.max) {
    const tokensToDiscard = lengths.journal - (lengths.max - lengths.reserved);
    squashed = decode(squashedTokens.slice(tokensToDiscard));
  }

  const messages: Prompt = [
    {role: "system", content: SYSTEM},
    {role: "user", content: `>>> ${squashed} <<<`},
  ]
  const response = await completion({
    model,
    max_tokens,
    temperature: 0,
    prompt: messages,
    skipTruncate: true,

    // Defaults, since everything's working in Playground, but not live.
    // I think it's because of JSON characters which are repeated, but penalized?
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  return parseCompletion(squashed, response)
}

export async function summarizeLambda({texts}: FnIn): Promise<ParsedCompletion> {
  // replace all \n with ' ' before master-prompting
  const squashed = squashTexts(texts)
  const fnName = Config.FN_SUMMARIZE_NAME
  const res = await lambdaSend<LambdaOut>({texts: squashed}, fnName, "RequestResponse")
  let txt: string = res.Payload.data[0].generated_text
  txt = txt.replaceAll('---', '\n')
  debugger
  return parseCompletion(squashed, txt)
}

/**
 * Helper function for summarize on insights page
 */
interface SummarizeInsights {
  entries: S.Entries.Entry[]
  context: FnContext,
  generative: boolean
}
export async function summarizeInsights({context, entries, generative}: SummarizeInsights) {
  async function sendInsights(parsed: ParsedCompletion): Promise<FnOut> {
    const themes: ThemesOut = parsed.themes
    const keywords = themes.map(t => t.keywords).flat()
    await Promise.all([
      sendInsight(
        r.insights_summarize_response,
        {...parsed, keywords},
        context
      ),
      sendInsight(
        r.insights_themes_response,
        parsed,
        context
      ),
    ])
  }

  if (entries.length === 0) {
    return sendInsights({
      title: "",
      summary: SUMMARIZE_EMPTY,
      failed: true,
      emotion: "neutral",
      themes: []
    })
  }
  if (!generative) {
    return sendInsights({
      title: "",
      summary: SUMMARIZE_DISABLED,
      failed: true,
      emotion: "neutral",
      themes: []
    })
  }
  const fn = generative ? summarizeOpenai : summarizeLambda
  const parsed = await fn({
    // summarize summaries, NOT full originals (to reduce token max)
    texts: entries.map(getSummary),
  })
  return sendInsights(parsed)
}

interface SuggestNextEntry {
  context: FnContext
  generative: boolean
  entries: S.Entries.Entry[]
  view: string
}
export async function suggestNextEntry({entries, context, generative, view}: SuggestNextEntry) {
  if (!generative) { return }
  if (!entries?.length) {return}
  const text = squashTexts(entries.map(getSummary))
  const response = await completion({
    model: "gpt-3.5-turbo-16k",
    max_tokens: 256,
    prompt: `Below in triple quotes are my previous journal entries. What should I journal about next to explore more deeply the deeper themes in these entries?\n"""${text}"""`
  })
  return sendInsight(
    r.insights_nextentry_response,
    {text: response},
    context
  )
}


export async function summarizeEntry({text, paras, generative}: SummarizeEntryIn): Promise<SummarizeEntryOut> {
  // This shouldn't happen, but I haven't tested to ensure
  if (paras.length === 0) {
    throw "paras.length === 0, investigate"
  }

  const fn = generative ? summarizeOpenai : summarizeLambda
  const parsed = await fn({
    // summarize summaries, NOT full originals (to reduce token max)
    texts: paras,
  })

  return {
    title: parsed.title,
    paras: [parsed.summary],
    body: {
      text: parsed.summary,
      emotion: parsed.emotion,
      keywords: parsed.themes.map(t => t.keywords).flat(),
    }
  }
}
