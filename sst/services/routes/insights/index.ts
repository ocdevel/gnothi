import * as S from '@gnothi/schemas'
import {GnothiError} from "../errors";
import {v4 as uuid} from 'uuid'
import {completion, defaultSystemMessage} from '../../ml/node/openai'
import {z} from 'zod'
// @ts-ignore
import dayjs from 'dayjs'
import {reduce as _reduce} from "lodash"
import type {Entry} from '@gnothi/schemas/entries'
import type {insights_ask_response, insights_themes_response, insights_summarize_response} from '@gnothi/schemas/insights'
import {summarize, summarizeInsights} from '../../ml/node/summarize/summarizer'
import {summarizeInsights as summarizeInsightsOpenai} from '../../ml/node/summarize/openai'
import {search} from '../../ml/node/search'
import {books} from '../../ml/node/books'
import {ask} from '../../ml/node/ask'
import {themes} from '../../ml/node/themes'
import {boolMapToKeys} from '@gnothi/schemas/utils'
import {getParas, getSummary, getText} from '@gnothi/schemas/entries'
import {Insights} from '../../data/models/insights'
import {Route} from '../types'
import {ulid} from "ulid";
import {inArray, eq, and} from "drizzle-orm";

const r = S.Routes.routes

export const insights_get_request = new Route(r.insights_get_request,async (req, context) => {
  // TODO check if any entry_ids correspond to entries not yet indexed, and remove from entry_ids if so
  return [req]
})

export const insights_get_response = new Route(r.insights_get_response,async (req, context) => {
  const {m, uid: user_id} = context
  const {view, entry_ids, insights} = req
  const query = insights.query || ""
  const promises = []
  // will be used to pair to which page called the insights client-side (eg list vs view)
  context.requestId = view
  const usePrompt = Boolean(context.user.premium)

  const entriesAll = await m.entries.getByIds(entry_ids)
  const entriesHash = Object.fromEntries(entriesAll.map(e => [e.id, e]))

  // Then run search, which will further filter the results
  const {idsFiltered, idsFromVectorSearch, search_mean, clusters} = await search({
    context,
    user_id,
    entries: entriesAll,
    query,
    usePrompt
  })
  const entriesFiltered = idsFiltered.map(id => entriesHash[id])

  if (query?.length && query.endsWith("?")) {
    promises.push(ask({
      context,
      query,
      user_id,
      usePrompt,
      // only send the top few matching documents. Ease the burden on QA ML, and
      // ensure best relevance from embedding-match
      entry_ids: idsFromVectorSearch.slice(0, 2)
    }))
  }

  if (insights.books) {
    promises.push(books({
      context,
      usePrompt,
      search_mean
    }))
  }

  if (insights.summarize) {
    if (usePrompt) {
      promises.push(summarizeInsightsOpenai({
        context,
        entries: entriesFiltered
      }))
    } else {
      promises.push(summarizeInsights({
        context,
        entries: entriesFiltered
      }))

      // Themes
      promises.push(themes({
        context,
        clusters,
        entries: entriesFiltered
      }))
    }
  }

  await Promise.all(promises)
  return [{view, done: true}]
})

// pass to background, prompt can take a long time
export const insights_prompt_request = new Route(r.insights_prompt_request,async (req, context) => {
  return [req]
})

export const insights_prompt_response = new Route(r.insights_prompt_response,async (req, context) => {
  const {messages, view} = req
  let messages_ = []

  // on the first prompt, we'll tee it up with their entries. We'll send it back
  // as a new chat, and going forward they'll send up the full chat context each message
  if (messages.length === 1) {
    const entries = await context.m.insights.entriesByIds(req.entry_ids)

    const texts = entries.length > 1 ? entries.map(getSummary) : entries.map(getText)
    const joined = texts.join(' ')
    const message = messages[0]

    messages_ = [{
      id: ulid(),
      role: "system",
      content: `${defaultSystemMessage} Below within triple quotes is a user's journal entry. Please read it and respond to the user's query: "${message.content}"`,
    }, {
      id: message.id,
      role: "user",
      content: `"""${joined}"""`
    }]
  } else if (messages.length > 1) {
    messages_ = messages
  } else {
    throw new GnothiError({code: 400, message: "Invalid messages length"})
  }

  const response = await completion({
    // entry v summary handled above, so just replace either/or here
    model: "gpt-4",
    max_tokens: 384,
    prompt: messages_.map(m => {
      // remove `id` from messages. Needed for request/response, but OpenAI doesn't want it
      const {id, ...rest} = m
      return rest
    })
  })

  // Return to them the full conversation history, as the client will use that going forward
  // to continue the conversation
  const fullChat = [
    ...messages_,
    {id: ulid(), role: "assistant", content: response}
  ]

  return [{
    id: ulid(),
    view: req.view,
    messages: fullChat
  }]
})
