import {z} from 'zod'
import {Route} from './api'
import {Passthrough, dateCol, IdCol, BoolMap} from './utils'
import {v4 as uuid} from 'uuid'
import {createInsertSchema} from "drizzle-zod";
import {notes} from '@gnothi/services/data/schemas/notes'
export * as Notes from './notes'

export const Note = createInsertSchema(notes, {
  created_at: dateCol(),
})
export type Note = z.infer<typeof Note>

export const entries_notes_list_request = z.object({
  entry_id: z.string()
})
export type entries_notes_list_request = z.infer<typeof entries_notes_list_request>
export const entries_notes_list_response = Note
export type entries_notes_list_response = z.infer<typeof entries_notes_list_response>
export const entries_notes_post_request = Note
export type entries_notes_post_request = z.infer<typeof entries_notes_post_request>
export const entries_notes_post_response = entries_notes_list_response
export type entries_notes_post_response = z.infer<typeof entries_notes_post_response>


export const routes = {
  entries_notes_list_request: {
    i: {
      e: 'entries_notes_list_request',
      s: entries_notes_list_request,
    },
    o: {
      e: 'entries_notes_list_response',
      s: entries_notes_list_response,
      keyby: "entry_id"
    }
  },
  entries_notes_post_request: {
    i: {
      e: "entries_notes_post_request",
      s: entries_notes_post_request,
    },
    o: {
      e: "entries_notes_post_response",
      s: entries_notes_post_response,
      event_as: "entries_notes_list_response",
      op: "append",
      keyby: 'entry_id'
    }
  },
}
