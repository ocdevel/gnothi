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

export const analyze_themes_response = z.object({
  id: z.string(), // anything, just need for keyby
  keywords: z.tuple([z.string(), z.number()]),
  summary: z.string()
})
export type analyze_themes_response = z.infer<typeof analyze_themes_response>

export const analyze_ask_response = z.object({
  id: z.string(), // anything, just need for keyby
  answer: z.string()
  // consider adding the relevant passages, with links to the entries
})
export type analyze_ask_response = z.infer<typeof analyze_ask_response>

export const analyze_summarize_response = z.object({
  id: z.string(), // anything, just need for keyby
  summary: z.string()
})
export type analyze_summarize_response = z.infer<typeof analyze_summarize_response>

export const analyze_get_final = z.object({
  done: z.literal(true)
})


export const routes = {
  analyze_get_request: new Route({
    i: {
      e: 'analyze_get_request',
      s: analyze_get_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "analyze_get_final",
      s: analyze_get_final,
      t: {ws: true}
    }
  }),

  // FIXME I'm breaking the Route system here, reconsider unidirectional routes
  analyze_ask_response: <DefO<any>>{
    e: "analyze_ask_response",
    s: analyze_ask_response,
    t: {ws: true}
  },
  analyze_themes_response: <DefO<any>>{
    e: "analyze_themes_response",
    s: analyze_themes_response,
    t: {ws: true}
  },
  analyze_summarize_response: <DefO<any>>{
    e: "analyze_summarize_response",
    s: analyze_summarize_response,
    t: {ws: true}
  }
}
