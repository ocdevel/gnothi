import {Entry} from '@gnothi/schemas/entries'
import {summarize, SummarizeOut} from "./summarize"
import {keyBy} from 'lodash'

type FnIn = {
  clusters: string[][],
  entries: Entry[]
}
type LambdaIn = never
type LambdaOut = never
type FnOut = SummarizeOut[]

export async function themes({clusters, entries}: FnIn): Promise<FnOut> {
  const entriesObj = keyBy(entries, 'id')
  return Promise.all(clusters.map(async (cluster) => {
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
}
