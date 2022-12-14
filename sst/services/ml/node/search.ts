import {lambdaSend} from "../../aws/handlers"
import {Entry} from '@gnothi/schemas/entries'
import {analyze_books_response} from '@gnothi/schemas/analyze'

type FnIn = {
  query: string
  user_id: string
  entries: Entry[]
}
type LambdaIn = {
  event: "search"
  data: {
    query: string
    entry_ids: string[]
    user_id: string
  }
}
type LambdaOut = {
  ids: string[]
  clusters: string[][]
  search_mean: number[]
}
type FnOut = LambdaOut & {
  entries: Entry[]
}
export async function search({user_id, entries, query}: FnIn): Promise<FnOut> {
  const {Payload} = await lambdaSend<LambdaOut>(
    {
      event: "search",
      data: {
        query,
        user_id,
        entry_ids: entries.map(e => e.id)
      }
    },
    process.env.fn_store,
    "RequestResponse"
  )
  return {
    ...Payload,
    entries: entries.filter(e => ~Payload.ids.indexOf(e.id))
  }
}
