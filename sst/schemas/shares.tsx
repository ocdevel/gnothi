import {z} from 'zod'
import {Route} from './api'
import {Passthrough, dateCol, IdCol} from './utils'
export * as Shares from './shares'
import {v4 as uuid} from 'uuid'

export const Share = z.object({
  id: IdCol,
  user_id: IdCol,
  created_at: dateCol(),

  email: z.boolean().default(false),
  username: z.boolean().default(true),
  first_name: z.boolean().default(false),
  last_name: z.boolean().default(false),
  gender: z.boolean().default(false),
  orientation: z.boolean().default(false),
  birthday: z.boolean().default(false),
  timezone: z.boolean().default(false),
  bio: z.boolean().default(false),
  people: z.boolean().default(false),

  fields: z.boolean().default(false),
  books: z.boolean().default(false),
})
export type Share = z.infer<typeof Share>

export const ShareTag = z.object({
  share_id: z.string().uuid(), // shares.id FK
  tag_id: z.string().uuid(), // tags.id FK
  selected: z.boolean().default(true),
})
export type ShareTag = z.infer<typeof ShareTag>

export const ShareUser = z.object({
  share_id: z.string().uuid(), // shares.id FK
  obj_id: z.string().uuid(), // users.id FK
})
export type ShareUser = z.infer<typeof ShareUser>

// export const ShareNotif = NotifCommon

export const shares_ingress_list_response = ShareUser
export type shares_ingress_list_response = z.infer<typeof shares_ingress_list_response>
export const shares_egress_list_response = Share
export type shares_egress_list_response = z.infer<typeof shares_egress_list_response>

export const routes = {
  shares_ingress_list_request: new Route({
    i: {
      e: 'shares_ingress_list_request',
      s: Passthrough,
    },
    o: {
      e: 'shares_ingress_list_response',
      s: shares_ingress_list_response,
      keyby: "obj_id"
    }
  }),
  shares_egress_list_request: new Route({
    i: {
      e: "shares_egress_list_request",
      s: Passthrough,
    },
    o: {
      e: "shares_egress_list_response",
      s: shares_egress_list_response,
    }

  })
}
