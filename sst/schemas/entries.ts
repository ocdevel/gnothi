import {z} from 'zod'
import {BoolMap, DateCol, IdCol, Passthrough} from './utils'
import {Route} from './api'
import {v4 as uuid} from "uuid";
export * as Entries from './entries'

export const Entry = z.object({
  id: IdCol,
  created_at: DateCol,
  updated_at: DateCol,
  n_notes: z.number().default(0),

  // Title optional, otherwise generated from text. topic-modeled, or BERT summary, etc?
  title: z.string().optional(),
  text: z.string(),
  no_ai: z.boolean().default(false),
  ai_ran: z.boolean().default(false),

  // Generated
  title_summary: z.string().optional(),
  text_summary: z.string().optional(),
  sentiment: z.string().optional(),

  user_id: IdCol, // FK users.id
})
export type Entry = z.infer<typeof Entry>

export const entries_list_request = Passthrough
export type entries_list_request = z.infer<typeof entries_list_request>
export const entries_list_response = Entry
export type entries_list_response = z.infer<typeof entries_list_response>
export const entries_upsert_request = z.object({
  entry: Entry
    .partial({id: true})
    .pick({
      id: true,
      title: true,
      text: true,
      no_ai: true,
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

export const routes = {
  entries_list_request: new Route({
    i: {
      e: 'entries_list_request',
      s: entries_list_request,
    },
    o: {
      e: 'entries_list_response',
      s: entries_list_response,
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
      event_as: "entries_list_response",
      keyby: 'entry.id'
    },
  })
}
