import {lambdaSend} from "../../aws/handlers"
import * as S from '@gnothi/schemas'
import {insights_books_response} from '@gnothi/schemas/insights'
import {Config} from 'sst/node/config'
import {sendInsight} from "./utils";
import {Entry} from '../../data/schemas/entries'
import {getText} from '@gnothi/schemas/entries'

const r = S.Routes.routes

type FnIn = {
  context?: S.Api.FnContext
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
type FnOut = Omit<LambdaOut, 'ids'> & {
  idsFromVectorSearch: string[]
  idsFiltered: string[]
}


export async function search({user_id, entries, query, context}: FnIn): Promise<FnOut> {
  // Get fnName while inside function because will only be present for FnBackground (not FnMain)
  const fnName = Config.FN_STORE_NAME

  // only do vector-search (search, books, etc) against entries which are definitely "done" indexing. We'll
  // account for the others a simple search, and merge them together at the end.
  const entriesIndexed = entries.filter(e => e.ai_index_state === 'done')
  const idsIndexed = entriesIndexed.map(e => e.id)
  const entriesNotIndexed = entries.filter(e => e.ai_index_state !== 'done')
  const idsFromBasicSearch = entriesNotIndexed.filter(basicSearch).map(e => e.id)
  function basicSearch(entry: Entry) {
    if (!query?.length) {return true}
    return getText(entry).toLowerCase().includes(query.toLowerCase())
  }

  async function vectorSearch() {
    if (!idsIndexed.length) {
      return {clusters: [], search_mean: [], ids: []}
    }
    // At least some entries are finished indexing. If they ran a search, we'll do a vector-search.
    // This assumes the vector-search lambda will return all ids, if no query was sent (the logic used elsewhere
    // in this file)
    const {Payload} = await lambdaSend<LambdaOut>(
      {
        event: "search",
        data: {
          query,
          user_id,
          entry_ids: idsIndexed,
          search_threshold: .6,
          community_threshold: .75
        }
      },
      fnName,
      "RequestResponse"
    )
    return Payload
  }

  const {ids: idsFromVectorSearch, ...vectorRes} = await vectorSearch()

  // idsFiltered will then be a list of ids which are generally applicable. Either (a) they passed the basic search,
  // (b) they passed the vector search, (c) there was no query to pass, etc
  // start with entries.filter() to maintain order, rather than concatting the two arrays
  const idsFiltered = entries
    .filter(e => idsFromBasicSearch.includes(e.id) || idsFromVectorSearch.includes(e.id))
    .map(e => e.id)


  await sendInsight(
    r.insights_search_response,
    {
      entry_ids: idsFiltered,
    },
    context
  )
  return {
    ...vectorRes,
    idsFromVectorSearch,
    idsFiltered,
  }
}
