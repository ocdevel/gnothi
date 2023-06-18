import {z} from 'zod'
import {Route} from './api'
import {Passthrough, dateCol, IdCol, BoolMap} from './utils'
export * as Shares from './shares'
import {shares} from '../services/data/schemas/shares'
import {createInsertSchema} from "drizzle-zod"

export const Share = createInsertSchema(shares, {
  created_at: dateCol(),
})
export type Share = z.infer<typeof Share>

export const ShareForm = z.object({
  share: Share,
  tags: BoolMap,
  users: BoolMap,
  groups: BoolMap,
})
export type ShareForm = z.infer<typeof ShareForm>

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
export const shares_egress_list_response = ShareForm
export type shares_egress_list_response = z.infer<typeof shares_egress_list_response>
export const shares_put_request = ShareForm
export type shares_put_request = z.infer<typeof shares_put_request>
export const shares_put_response = shares_egress_list_response
export type shares_put_response = z.infer<typeof shares_put_response>
export const shares_post_request = shares_put_request
  .omit({share: true})
  .extend({share: ShareForm.omit({id: true})})
export type shares_post_request = z.infer<typeof shares_post_request>
export const shares_post_response = shares_egress_list_response
export type shares_post_response = z.infer<typeof shares_post_response>



export const routes = {
  shares_ingress_list_request: {
    i: {
      e: 'shares_ingress_list_request',
      s: Passthrough,
    },
    o: {
      e: 'shares_ingress_list_response',
      s: shares_ingress_list_response,
      keyby: "obj_id"
    }
  },
  shares_egress_list_request: {
    i: {
      e: "shares_egress_list_request",
      s: Passthrough,
    },
    o: {
      e: "shares_egress_list_response",
      s: shares_egress_list_response,
      keyby: 'share.id'
    }
  },
  shares_post_request: {
    i: {
      e: "shares_post_request",
      s: shares_post_request,
      snoopable: false,
    },
    o: {
      e: "shares_post_response",
      s: shares_post_response,
      event_as: "shares_egress_list_request",
      op: "update"
    }
  },
  shares_put_request: {
    i: {
      e: "shares_put_request",
      s: shares_put_request,
      snoopable: false,
    },
    o: {
      e: "shares_put_response",
      s: shares_put_response,
      event_as: "shares_egress_list_request",
      op: "update"
    }
  }
}
