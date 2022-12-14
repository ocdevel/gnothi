import {Entry} from '@gnothi/schemas/entries'
import {summarize} from "./summarize";

type FnIn = {
  clusters: string[][],
  entries: Entry[]
}
type LambdaIn = never
type LambdaOut = never
type FnOut = Array<{
  keywords: string[]
  summary: string
  emotion: string
}>

export async function themes({clusters, entries}: FnIn): Promise<FnOut> {
  return []  // FIXME
  const groups = await getClusters(entries.map(e => e.id))
  const texts = groups.map(g => g.content) as [string, ...string[]]
  const summaries = await summarize({
    texts,
    params: [{
      summarize: {min_length: 50, max_length: 100},
      emotion: true,
      keywords: {top_n: 5}
    }]
  })
  return summaries
}
