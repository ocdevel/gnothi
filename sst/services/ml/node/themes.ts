import {Entry} from '@gnothi/schemas/entries'
import {summarize, SummarizeOut} from "./summarize"
import {keyBy} from 'lodash'
import * as S from '@gnothi/schemas'
import {insights_themes_response, insights_summarize_response} from '@gnothi/schemas/insights'
import {ulid} from 'ulid'
import {sendInsight} from "./utils";
import {completion} from './openai'

type FnIn = {
  context?: S.Api.FnContext
  clusters: string[][],
  entries: Entry[]
}
type LambdaIn = never
type LambdaOut = never
type FnOut = insights_themes_response['themes']

async function theme(texts: string[]): Promise<insights_themes_response['themes'][number]> {
  const [word, summary] = await Promise.all([
    completion({prompt: `What one word describes the following content: ${texts.join('\n')}`}),
    summarize({
      texts,
      params: [{
        summarize: {min_length: 30, max_length: 90},
        emotion: true,
        keywords: {top_n: 3}
      }]
    })
  ])

  return {
    ...summary[0] as insights_summarize_response,
    id: ulid(),
    word,
  }
}

export async function themes({clusters, entries, context}: FnIn): Promise<FnOut> {
  const entriesObj = keyBy(entries, 'id')
  const res = await Promise.all(clusters.map(async (cluster) => {
    const texts = cluster.map(id => entriesObj[id].text)
    return theme(texts)
  }))
  await sendInsight(
    S.Routes.routes.insights_themes_response,
    {themes: res},
    context
  )
  return res
}
