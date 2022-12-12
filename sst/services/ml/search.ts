import {lambdaSend} from "../aws/handlers"
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
  answer?: string
  ids: string[]
  books: analyze_books_response[]
  groups: any[]
}
type FnOut = LambdaOut & {
  entries: Entry[]
}
export async function search({user_id, entries, query}: FnIn): Promise<FnOut> {
  const functionName = process.env.fn_search

  async function call(data: LambdaIn): Promise<LambdaOut> {
    const res = await lambdaSend<LambdaOut>(data, functionName, "RequestResponse")
    return res.Payload
  }

  const res = await call({
    event: "search",
    data: {
      query,
      user_id,
      entry_ids: entries.map(e => e.id)
    }
  })
  return {
    ...res,
    entries: entries.filter(e => ~res.ids.indexOf(e.id))
  }
}
