import {z} from 'zod'
export * as Analyze from './analyze'
// @ts-ignore
import dayjs from 'dayjs'
import {Route, DefO} from "./api";

const JustDate = z.string().regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)
export const analyze_get_request = z.object({
  startDate: JustDate
    .optional()
    .default(
      dayjs().subtract(3, 'month').format("YYYY-MM-DD")
    ),
  endDate: JustDate.or(z.literal("now")).default("now"),
  search: z.string().optional(), // if using a ?, acts as a question
  tags: z.record(z.string(), z.boolean()).default({})
})
export type analyze_get_request = z.infer<typeof analyze_get_request>

// pass the request through to python lambda. It will also send back to the client,
// but client only cares that it's in the queue so that's fine
export const analyze_get_response = analyze_get_request
export type instances_get_response = z.infer<typeof analyze_get_response>

export const analyze_ask_response = z.object({
  id: z.string(), // anything, just need for keyby
  answer: z.string()
  // consider adding the relevant passages, with links to the entries
})
export type analyze_ask_response = z.infer<typeof analyze_ask_response>

export const analyze_summarize_response = z.object({
  id: z.string(), // anything, just need for keyby
  summary: z.string(),
  keywords: z.string().array(),
  emotion: z.enum([
    // "anger 🤬 disgust 🤢 fear 😨 joy 😀 neutral 😐 sadness 😭 surprise 😲"
    "anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"
  ]).optional()
})
export type analyze_summarize_response = z.infer<typeof analyze_summarize_response>

// summarize will be a single string wrapped as an array [string]
// themes will be clustered version of the same, so multiple summaries
export const analyze_themes_response = analyze_summarize_response
export type analyze_themes_response = z.infer<typeof analyze_themes_response>

export const analyze_get_final = z.object({
  done: z.boolean()
})

export const analyze_books_response = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  author: z.string(),
  genre: z.string()
})
export type analyze_books_response = z.infer<typeof analyze_books_response>

export const analyze_search_response = z.object({id: z.string()})
export type analyze_search_response = z.infer<typeof analyze_search_response>

export const analyze_prompt_request = z.object({
  entry_ids: z.string().array(),
  prompt: z.string()
})
export type analyze_prompt_request = z.infer<typeof analyze_prompt_request>
export const analyze_prompt_response = z.object({
  id: z.string(),
  response: z.string()
})
export type analyze_prompt_response = z.infer<typeof analyze_prompt_response>

export const routes = {
  analyze_get_request: new Route({
    i: {
      e: 'analyze_get_request',
      s: analyze_get_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "analyze_get_response",
      s: analyze_get_response,
      t: {ws: true, background: true}
    }
  }),
  analyze_get_response: new Route({
    i: {
      e: 'analyze_get_response',
      s: analyze_get_response,
      t: {background: true},
    },
    o: {
      e: "analyze_get_final",
      s: analyze_get_final,
      t: {ws: true}
    }
  }),

  analyze_prompt_request: new Route({
    i: {
      e: 'analyze_prompt_request',
      s: analyze_prompt_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "analyze_prompt_response",
      s: analyze_prompt_response,
      t: {ws: true},
      keyby: 'id',
    }
  }),

  // FIXME I'm breaking the Route system here, reconsider unidirectional routes
  analyze_search_response: <DefO<any>>{
    e: "analyze_search_response",
    s: analyze_search_response,
    t: {ws: true},
    keyby: 'id'
  },
  analyze_ask_response: <DefO<any>>{
    e: "analyze_ask_response",
    s: analyze_ask_response,
    t: {ws: true},
    keyby: 'id'
  },
  analyze_themes_response: <DefO<any>>{
    e: "analyze_themes_response",
    s: analyze_themes_response,
    t: {ws: true},
    keyby: 'id'
  },
  analyze_summarize_response: <DefO<any>>{
    e: "analyze_summarize_response",
    s: analyze_summarize_response,
    t: {ws: true},
    keyby: 'id'
  },
  analyze_books_response: <DefO<any>>{
    e: "analyze_books_response",
    s: analyze_books_response,
    t: {ws: true},
    keyby: 'id'
  }
}
