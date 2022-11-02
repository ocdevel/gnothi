import {z} from 'zod'
import {def, Passthrough} from './utils'
import {fakeData as fakeUsers} from "./users";
import {v4 as uuid} from "uuid";
export * as Tags from './tags'

export const Tag = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(), // FK
  name: z.string(),
  created_at: z.date().default(() => new Date()),
  // save user's selected tags between sessions
  selected: z.boolean().default(true),
  main: z.boolean().default(false),
  sort: z.number().default(0),
  ai: z.boolean().default(true)
})
export type Tag = z.infer<typeof Tag>

export const tags_post_request = Tag.pick({
  name: true,
  main: true,
  ai: true
})
export type tags_post_request = z.infer<typeof tags_post_request>
export const tags_put_request = tags_post_request
export type tags_put_request = z.infer<typeof tags_put_request>

export const tags_toggle_request = Tag.pick({
  id: true
})
export type tags_toggle_request = z.infer<typeof tags_toggle_request>

export const EntryTag = z.object({
  entry_id: z.string().uuid(), // entries.id FK
  tag_id: z.string().uuid(), // tags.id FK
})
export type EntryTag = z.infer<typeof EntryTag>

export const routes = {
  tags_list_request: def({
    eventIn: 'tags_list_request',
    eventOut: 'tags_list_response',
    schemaIn: Passthrough,
    schemaOut: Tag,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  }),
  tags_list_response: null,
  tags_toggle_request: def({
    eventIn: 'tags_toggle_request',
    eventOut: 'tags_toggle_response',
    schemaIn: tags_toggle_request,
    schemaOut: Passthrough,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  })
}

export const fakeData = {
  tags: [
    Tag.parse({
      id: uuid(),
      user_id: fakeUsers.self.id,
      name: "Main",
      main: true,
    }),
    Tag.parse({
      id: uuid(),
      user_id: fakeUsers.self.id,
      name: "Dreams",
      main: false,
      sort: 1,
      ai: false
    }),
    Tag.parse({
      id: uuid(),
      user_id: fakeUsers.self.id,
      name: "Shared",
      main: false,
      sort: 2,
    })
  ]
}
