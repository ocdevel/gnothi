import {Entry} from '@gnothi/schemas/entries'
import {summarize} from "./summarize";

type FnIn = Entry[]
type LambdaIn = string[]
type LambdaOut = Array<{
  name: string
  content: string
}>
type FnOut = Array<{
  keywords: string[]
  summary: string
  emotion: string
}>

// TODO move this to Python for consistency / better control (their node module is rough)
async function getClusters(ids: LambdaIn): Promise<LambdaOut> {
  const res = await weaviateDo(weaviateClient.graphql.raw().withQuery(`{
  Get { 
    Paragraph (group: {type: merge, force: 0.25}) {
      content
    }
  }
  }`)) as any
  console.log(res)
  return res.data.Get.Paragraph
}
export async function themes(entries: FnIn): Promise<FnOut> {
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
