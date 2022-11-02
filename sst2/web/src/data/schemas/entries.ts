import {z} from 'zod'
import {dateCol, idCol, def, Passthrough} from './utils'
import {v4 as uuid} from "uuid";
import {fakeData as fakeUsers} from './users'
export * as Entries from './entries'

export const Entry = z.object({
  id: idCol(),
  created_at: dateCol(),
  updated_at: dateCol(),
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

  user_id: idCol(), // FK users.id
})
export type Entry = z.infer<typeof Entry>

export const entries_post_request = Entry.pick({
  title: true,
  text: true,
  no_ai: true,
  created_at: true
})
export type entries_post_request = z.infer<typeof entries_post_request>
export const entries_put_request = entries_post_request
export type entries_put_request = z.infer<typeof entries_put_request>

export const routes = {
  entries_list_request: def({
    eventIn: 'entries_list_request',
    eventOut: 'entries_list_response',
    schemaIn: Passthrough,
    schemaOut: Entry,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  }),
  entries_list_response: null
}

export const fakeData = [
  Entry.parse({
    id: uuid(),
    title: "My first entry",
    text: "This is my first entry. I'm excited to start using this app!",
    user_id: fakeUsers.self.id,
  }),
  Entry.parse({
    id: uuid(),
    title: "My first entry",
    text: "This is my first entry. I'm excited to start using this app!",
    user_id: fakeUsers.self.id,
  }),
  Entry.parse({
    id: uuid(),
    title: "My second entry",
    text: "This is my second entry. I'm excited to start using this app!",
    user_id: fakeUsers.self.id,
  }),
  Entry.parse({
    id: uuid(),
    title: "My third entry",
    text: "This is my third entry. I'm excited to start using this app!",
    user_id: fakeUsers.self.id,
  })
]
