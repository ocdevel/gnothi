import {z} from 'zod'
import {Passthrough, DateCol} from './utils'
import {Route} from './api'
import {v4 as uuid} from "uuid";
import {useStore} from "@gnothi/web/src/data/store";
export * as Tags from './tags'

export const Tag = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(), // FK
  name: z.string(),
  created_at: DateCol,
  // save user's selected tags between sessions
  selected: z.boolean().default(true),
  main: z.boolean().default(false),
  sort: z.number().default(0),
  ai_index: z.boolean().default(true),
  ai_summarize: z.boolean().default(true)
})
export type Tag = z.infer<typeof Tag>

export const tags_post_request = Tag.pick({
  name: true,
})
export type tags_post_request = z.infer<typeof tags_post_request>
export const tags_put_request = Tag.pick({
  id: true,
  name: true,
  ai_index: true,
  ai_summarize: true,
  sort: true,
})
export type tags_put_request = z.infer<typeof tags_put_request>
export const tags_list_response = Tag
export type tags_list_response = z.infer<typeof tags_list_response>
export const tags_delete_request = z.object({
  id: z.string()
})
export type tags_delete_request = z.infer<typeof tags_delete_request>
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
  tags_list_request: new Route({
    i: {
      e: 'tags_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'tags_list_response',
      s: Tag,
      t: {ws: true},
      keyby: "id"
    }
  }),
  tags_post_request: new Route({
    i: {
      e: 'tags_post_request',
      s: tags_post_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'tags_post_response',
      s: Tag,
      t: {ws: true},
      event_as: "tags_list_response",
      op: "append",
      keyby: "id"
    }
  }),
  tags_put_request: new Route({
    i: {
      e: 'tags_put_request',
      s: tags_put_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'tags_put_response',
      s: Tag,
      t: {ws: true},
      event_as: "tags_list_response",
      op: "update",
      keyby: "id"
    }
  }),
  tags_delete_request: new Route({
    i: {
      e: "tags_delete_request",
      s: tags_delete_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: "void", // will call tags_get_request
      s: Passthrough,
      t: {ws: true},
    }
  }),
  tags_toggle_request: new Route({
    i: {
      e: 'tags_toggle_request',
      s: tags_toggle_request,
      t: {ws: true},
    },
    o: {
      e: 'tags_toggle_response',
      s: Passthrough,
      t: {ws: true},
    }
  })
}
