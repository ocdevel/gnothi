import {z} from 'zod'
export * as Insights from './insights'
import dayjs from 'dayjs'
import {Route} from "./api";

const JustDate = z.string().regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)
export const insights_get_request = z.object({
  startDate: JustDate
    .optional()
    .default(
      dayjs().subtract(3, 'month').format("YYYY-MM-DD")
    ),
  endDate: JustDate.or(z.literal("now")).default("now"),
  search: z.string().optional(), // if using a ?, acts as a question
  tags: z.record(z.string(), z.boolean()).default({})
})
export type insights_get_request = z.infer<typeof insights_get_request>

// pass the request through to python lambda. It will also send back to the client,
// but client only cares that it's in the queue so that's fine
export const insights_get_response = insights_get_request
export type instances_get_response = z.infer<typeof insights_get_response>

export const insights_themes_response = z.object({
  rows: z.string().array()
})
export type insights_themes_response = z.infer<typeof insights_themes_response>

export const insights_question_response = z.object({
  rows: z.string().array()
})
export type insights_question_response = z.infer<typeof insights_question_response>

export const insights_summarize_response = z.object({
  rows: z.string().array()
})
export type insights_summarize_response = z.infer<typeof insights_summarize_response>

export const routes = {
  insights_get_request: new Route({
    i: {
      e: 'insights_get_request',
      s: insights_get_request,
      t: {ws: true},
      snoopable: true
    },
    o: {
      e: "insights_get_response",
      s: insights_get_response,
      t: {ws: true}
    }
  }),
}
