import {Entry} from '@gnothi/schemas/entries'
import {summarize, SummarizeOut} from "./summarize"
import {keyBy} from 'lodash'
import * as S from '@gnothi/schemas'
import {v4 as uuid} from 'uuid'

type FnIn = {
  context?: S.Api.FnContext
  clusters: string[][],
  entries: Entry[]
}
type LambdaIn = never
type LambdaOut = never
type FnOut = SummarizeOut[]

export async function themes({clusters, entries, context}: FnIn): Promise<FnOut> {
  // FIXME
  return []
  const entriesObj = keyBy(entries, 'id')
  const res = Promise.all(clusters.map(async (cluster) => {
    const texts = cluster.map(id => entriesObj[id].text)
    const summary = await summarize({
      texts,
      params: [{
        summarize: {min_length: 50, max_length: 100},
        emotion: true,
        keywords: {top_n: 5}
      }]
    })
    return summary[0]
  }))
  if (context?.connectionId) {
    await context.handleRes(
      S.Routes.routes.analyze_themes_response,
      {data: res.map(theme => ({id: uuid(), ...theme}))},
      context
    )
  }
  return res
}
