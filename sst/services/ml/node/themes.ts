import {Entry} from '@gnothi/schemas/entries'
import {summarize, SummarizeOut, keywordsDefaults} from "./summarize"
import {keyBy} from 'lodash'
import * as S from '@gnothi/schemas'
import {insights_themes_response, insights_summarize_response} from '@gnothi/schemas/insights'
import {ulid} from 'ulid'
import {sendInsight} from "./utils";
import {completion} from './openai'
import {getSummary} from "@gnothi/schemas/entries";

type FnIn = {
  context?: S.Api.FnContext
  clusters: string[][],
  entries: Entry[]
  usePrompt: boolean
}
type LambdaIn = never
type LambdaOut = never
type FnOut = insights_themes_response['themes']

interface OneWord {
  text: string
  usePrompt: boolean
}
async function oneWord({text, usePrompt}: OneWord): Promise<string | undefined> {
  // TODO figure out how to use this without OpenAI. I'm thinking t5-flan?
  if (!usePrompt) { return undefined }
  try {
    return completion({prompt: `What one word describes the following content: ${text}`})
  } catch (e) {
    return undefined
  }
}

interface Theme {
  texts: string[]
  usePrompt: boolean
}
async function theme({texts, usePrompt}: Theme): Promise<insights_themes_response['themes'][number]> {
  const text = texts.join('\n')
  const [word, summary] = await Promise.all([
    oneWord({text, usePrompt}),
    summarize({
      texts,
      params: [{
        summarize: {min_length: 10, max_length: 15},
        emotion: true,
        keywords: keywordsDefaults
      }],
      usePrompt
    })
  ])

  return {
    ...summary[0] as insights_summarize_response,
    id: ulid(),
    word,
  }
}

export async function themes({clusters, entries, context, usePrompt}: FnIn): Promise<FnOut> {
  const entriesObj = keyBy(entries, 'id')
  const res = await Promise.all(clusters.map(async (cluster) => {
    const texts = cluster.map(id => getSummary(entriesObj[id]))
    return theme({texts, usePrompt})
  }))
  await sendInsight(
    S.Routes.routes.insights_themes_response,
    {themes: res},
    context
  )
  return res
}
