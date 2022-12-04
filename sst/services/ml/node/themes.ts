import {weaviateClient, weaviateDo} from "../../data/weaviate";
import {Entry} from '@gnothi/schemas/entries'
import {summarize} from "./summarize";
import {keywords} from './keywords'

type FnIn = Entry[]
type LambdaIn = string[]
type LambdaOut = Array<{
  name: string
  content: string
}>
type FnOut = Array<{
  keywords: [string, number][]
  summary: string
}>

// TODO move this to Python for consistency / better control (their node module is rough)
async function getClusters(ids: LambdaIn): Promise<LambdaOut> {
  const res = await weaviateDo(weaviateClient.graphql.raw().withQuery(`{
  Get { 
    Object (group: {type: merge, force: 0.25}) {
      name
      content
    }
  }
  }`)) as any
  return res.data.Get.Object
}
export async function themes(entries: FnIn): Promise<FnOut> {
  const groups = await getClusters(entries.map(e => e.id))
  debugger
  const texts = groups.map(g => g.content) as [string, ...string[]]
  const pKeywords = keywords({texts, params: [{top_n: 5}]})
  const pSummaries = summarize({texts, params: [{min_length: 50, max_length: 100}]})
  const combo = await Promise.all([pKeywords, pSummaries])
  return groups.map((_, i) => ({
    keywords: combo[0][i],
    summary: combo[1][i]
  }))
}
