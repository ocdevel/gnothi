import {z} from 'zod'
export * as Insights from './insights'
// @ts-ignore
import dayjs from 'dayjs'
import {Route, DefO} from "./api"


const Insight = z.object({
  // `id` will determine where these insights are run for. Eg, list-view's id might be
  // 'list' or the concatenated ids. A single entry-view's id will be that entry.id.
  view: z.string(),
})

export const insights_get_request = Insight.extend({
  entry_ids: z.string().array(),
  insights: z.object({
    summarize: z.boolean().optional(), // also includes themes
    query: z.string().optional(), // if using a ?, acts as a question
    books: z.boolean().optional(),
    prompt: z.string().array().optional(),
  })
})
export type insights_get_request = z.infer<typeof insights_get_request>
export const insights_get_response = insights_get_request
export type insights_get_response = z.infer<typeof insights_get_response>

export const insights_ask_response = Insight.extend({
  answer: z.string()
  // consider adding the relevant passages, with links to the entries
})
export type insights_ask_response = z.infer<typeof insights_ask_response>

export const insights_summarize_response = Insight.extend({
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
export const insights_themes_response = z.object({
  themes: insights_summarize_response.extend({
    word: z.string().optional(),
    id: z.string()
  }).array()
})
export type insights_themes_response = z.infer<typeof insights_themes_response>

export const insights_get_final = Insight.extend({
  done: z.boolean()
})

export const insights_books_response = Insight.extend({
  books: z.object({
    id: z.number(),
    name: z.string(),
    content: z.string(),
    author: z.string(),
    genre: z.string()
  }).array()
})
export type insights_books_response = z.infer<typeof insights_books_response>

export const insights_search_response = Insight.extend({
  entry_ids: z.string().array()
})
export type insights_search_response = z.infer<typeof insights_search_response>

export const Message = z.object({
  id: z.string(), // just a timestamp or something, it's needed for `key` in React
  role: z.enum(["system", "user", "assistant"]),
  content: z.string()
})
export type Message = z.infer<typeof Message>

export const insights_prompt_request = Insight.extend({
  entry_ids: z.string().array(),
  messages: Message.array(),
  model: z.enum(['gpt-3.5-turbo-16k', 'gpt-4'])
})
export type insights_prompt_request = z.infer<typeof insights_prompt_request>
export const insights_prompt_response = insights_prompt_request
export type insights_prompt_response = z.infer<typeof insights_prompt_response>
export const insights_prompt_final = Insight.extend({
  id: z.string(), // different than messages[].id, this is needed for keyby in the Event system
  messages: Message.array()
})
export type insights_prompt_final = z.infer<typeof insights_prompt_final>

export const routes = {
  insights_get_request: {
    i: {
      e: 'insights_get_request',
      s: insights_get_request,
      snoopable: true,
      t: {ws: true},
    },
    o: {
      e: 'insights_get_response',
      s: insights_get_response,
      t: {ws: true, background: true},
      keyby: 'view'
    }
  },
  insights_get_response: {
    i: {
      e: 'insights_get_response',
      s: insights_get_response,
      t: {background: true},
    },
    o: {
      e: 'insights_get_final',
      s: insights_get_final,
      t: {ws: true},
      keyby: 'view'
    }
  },
  insights_prompt_request: {
    i: {
      e: 'insights_prompt_request',
      s: insights_prompt_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "insights_prompt_response",
      s: insights_prompt_response,
      t: {background: true},
    }
  },

  insights_prompt_response: {
    i: {
      e: 'insights_prompt_response',
      s: insights_prompt_response,
      t: {background: true},
    },
    o: {
      e: "insights_prompt_final",
      s: insights_prompt_final,
      t: {ws: true},
      keyby: 'view',
    }
  },

  // FIXME I'm breaking the Route system here, reconsider unidirectional routes
  insights_search_response: <DefO<any>>{
    e: "insights_search_response",
    s: insights_search_response,
    t: {ws: true},
    keyby: 'view'
  },
  insights_ask_response: <DefO<any>>{
    e: "insights_ask_response",
    s: insights_ask_response,
    t: {ws: true},
    keyby: 'view'
  },
  insights_themes_response: <DefO<any>>{
    e: "insights_themes_response",
    s: insights_themes_response,
    t: {ws: true},
    keyby: 'view'
  },
  insights_summarize_response: <DefO<any>>{
    e: "insights_summarize_response",
    s: insights_summarize_response,
    t: {ws: true},
    keyby: 'view'
  },
  insights_books_response: <DefO<any>>{
    e: "insights_books_response",
    s: insights_books_response,
    t: {ws: true},
    keyby: 'view'
  }
}
