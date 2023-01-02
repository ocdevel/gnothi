import {z} from 'zod'
export * as Insights from './insights'
// @ts-ignore
import dayjs from 'dayjs'
import {Route, DefO} from "./api";

export const insights_ask_response = z.object({
  id: z.string(), // anything, just need for keyby
  answer: z.string()
  // consider adding the relevant passages, with links to the entries
})
export type insights_ask_response = z.infer<typeof insights_ask_response>

export const insights_summarize_response = z.object({
  id: z.string(), // anything, just need for keyby
  summary: z.string(),
  keywords: z.string().array(),
  emotion: z.enum([
    // "anger 🤬 disgust 🤢 fear 😨 joy 😀 neutral 😐 sadness 😭 surprise 😲"
    "anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"
  ]).optional()
})
export type insights_summarize_response = z.infer<typeof insights_summarize_response>

// summarize will be a single string wrapped as an array [string]
// themes will be clustered version of the same, so multiple summaries
export const insights_themes_response = insights_summarize_response
export type insights_themes_response = z.infer<typeof insights_themes_response>

export const insights_get_final = z.object({
  done: z.boolean()
})

export const insights_books_response = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  author: z.string(),
  genre: z.string()
})
export type insights_books_response = z.infer<typeof insights_books_response>

export const insights_search_response = z.object({id: z.string()})
export type insights_search_response = z.infer<typeof insights_search_response>

export const insights_prompt_request = z.object({
  entry_ids: z.string().array(),
  prompt: z.string()
})
export type insights_prompt_request = z.infer<typeof insights_prompt_request>
export const insights_prompt_response = z.object({
  id: z.string(),
  response: z.string()
})
export type insights_prompt_response = z.infer<typeof insights_prompt_response>

export const routes = {
  insights_prompt_request: new Route({
    i: {
      e: 'insights_prompt_request',
      s: insights_prompt_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "insights_prompt_response",
      s: insights_prompt_response,
      t: {ws: true},
      keyby: 'id',
    }
  }),

  // FIXME I'm breaking the Route system here, reconsider unidirectional routes
  insights_search_response: <DefO<any>>{
    e: "insights_search_response",
    s: insights_search_response,
    t: {ws: true},
    keyby: 'id'
  },
  insights_ask_response: <DefO<any>>{
    e: "insights_ask_response",
    s: insights_ask_response,
    t: {ws: true},
    keyby: 'id'
  },
  insights_themes_response: <DefO<any>>{
    e: "insights_themes_response",
    s: insights_themes_response,
    t: {ws: true},
    keyby: 'id'
  },
  insights_summarize_response: <DefO<any>>{
    e: "insights_summarize_response",
    s: insights_summarize_response,
    t: {ws: true},
    keyby: 'id'
  },
  insights_books_response: <DefO<any>>{
    e: "insights_books_response",
    s: insights_books_response,
    t: {ws: true},
    keyby: 'id'
  }
}
