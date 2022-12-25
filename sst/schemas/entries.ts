import {z} from 'zod'
import {BoolMap, dateCol, IdCol, Passthrough} from './utils'
import {Route} from './api'
import {v4 as uuid} from "uuid";
export * as Entries from './entries'

const AiState = z.enum(['todo', 'skip', 'running', 'done']).optional()
export const Entry = z.object({
  id: IdCol,
  created_at: dateCol(),
  updated_at: dateCol(),
  n_notes: z.number().default(0),

  // Title optional, otherwise generated from text. topic-modeled, or BERT summary, etc?
  title: z.string().optional(),
  text: z.string(),
  text_clean: z.string().optional(),
  text_paras: z.string().array().optional(),

  ai_index_state: AiState,
  ai_summarize_state: AiState,
  ai_title: z.string().optional(),
  ai_text: z.string().optional(),
  ai_sentiment: z.string().optional(),
  ai_keywords: z.string().array().optional(),

  user_id: IdCol, // FK users.id
})
export type Entry = z.infer<typeof Entry>

export const entries_list_request = Passthrough
export type entries_list_request = z.infer<typeof entries_list_request>
export const entries_list_response = z.object({
  entry: Entry,
  tags: BoolMap
})
export type entries_list_response = z.infer<typeof entries_list_response>
export const entries_upsert_request = z.object({
  entry: Entry
    .partial({id: true})
    .pick({
      id: true,
      title: true,
      text: true,
      created_at: true
    }),
  tags: BoolMap
})
export type entries_upsert_request = z.infer<typeof entries_upsert_request>
export const entries_upsert_response = z.object({
  entry: Entry,
  tags: BoolMap
})
export type entries_upsert_response = z.infer<typeof entries_upsert_response>

// _response will have a version without the AI inserts. _final will have all the inserts
export const entries_upsert_final = entries_upsert_response
export type entries_upsert_final = z.infer<typeof entries_upsert_final>

export const routes = {
  entries_list_request: new Route({
    i: {
      e: 'entries_list_request',
      s: entries_list_request,
    },
    o: {
      e: 'entries_list_response',
      s: entries_list_response,
      keyby: "entry.id"
    },
  }),
  entries_upsert_request: new Route({
    i: {
      e: 'entries_upsert_request',
      s: entries_upsert_request,
    },
    o: {
      e: 'entries_upsert_response',
      s: entries_upsert_response,
      t: {ws: true, background: true},
      event_as: "entries_list_response",
      keyby: 'entry.id',
      op: "prepend",
    },
  }),
  entries_upsert_response: new Route({
    i: {
      e: 'entries_upsert_response',
      s: entries_upsert_response
    },
    o: {
      // Intermediate steps (_response, _etc) will be sent manually via
      // websockets, the final result will be pushed via _final
      e: 'entries_upsert_final',
      s: entries_upsert_final,
      t: {ws: true},
      event_as: "entries_list_response",
      keyby: 'entry.id',
    },
  }),
}
