import {lambdaSend} from "../../aws/handlers"
import {Function} from "@serverless-stack/node/function"
import {Entry} from '@gnothi/schemas/entries'

interface Params {
  top_n: number
}
interface FnIn {
  texts: [string, ...string[]]
  params: [Params, ...Params[]]
}
type LambdaIn = {text: string, params: Params}[]
type LambdaOut = {
  answer?: string
  ids: string[]
}
type FnOut = {
  answer?: string
  entries: Entry[]
}
interface SearchResults {
  answer?: string
  entries: Entry[]
}
export async function search(entries: Entry[], query: string = ""): Promise<SearchResults> {
  if (!query?.length) {
    return {entries}
  }
  const res = (await lambdaSend<LambdaOut>(
    {ids: entries.map(e => e.id), query},
    Function.fn_search.functionName,
    "RequestResponse"
  )).Payload
  const filteredEntries = entries.filter(e => ~res.ids.indexOf(e.id))
  return {answer: res.answer, entries: filteredEntries}
}
