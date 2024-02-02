import {z} from 'zod'
import {Route} from './api'
import {Passthrough, dateCol, IdCol, BoolMap} from './utils'
export * as Shares from './shares'
import {shares, sharesTags, sharesUsers} from '../services/data/schemas/shares'
import {createInsertSchema, createSelectSchema} from "drizzle-zod"

export const shareProfileFields = [
  'username',
  'email',
  'first_name',
  'last_name',
  'bio',
  'people',
  'gender',
  'orientation',
  'birthday',
  'timezone'
] as const
export type ShareProfileField = typeof shareProfileFields[number]
export const shareFeatures = [
  'profile',
  'fields',
  // 'books'
] as const
export type ShareFeature = typeof shareFeatures[number]

export const Share = createInsertSchema(shares, {
  created_at: dateCol(),
})
export type Share = z.infer<typeof Share>

// remove profile; that's a client-side trigger to show the inner fields
// TODO gotta remove 'profile' from all server/schema stuff; just add it to the UI
const sharesShareFields = [...shareProfileFields, ...shareFeatures].filter(k => k !== 'profile')
const sharesShareZodArr = sharesShareFields.map( (k) => [k, z.boolean().optional()] )
const sharesShareZodObj = z.object(Object.fromEntries(sharesShareZodArr))

export const SharePost = z.object({
  share: sharesShareZodObj,
  tags: BoolMap,
  users: z.record(
    z.string().email(),
    z.boolean(),
  ).default(() => ({})),
  groups: BoolMap,
})
export const SharePut = SharePost.extend({
  id: z.string().uuid(),
})
export const ShareGet = SharePut.extend({
  // TODO double check no privacy issues here
  share: Share
})

export const ShareTag = createSelectSchema(sharesTags)
export type ShareTag = z.infer<typeof ShareTag>

export const ShareUser = createSelectSchema(sharesUsers)
export type ShareUser = z.infer<typeof ShareUser>

// export const ShareNotif = NotifCommon

export const shares_ingress_list_response = ShareUser
export type shares_ingress_list_response = z.infer<typeof shares_ingress_list_response>
export const shares_egress_list_response = ShareGet
export type shares_egress_list_response = z.infer<typeof shares_egress_list_response>
export const shares_put_request = SharePut
export type shares_put_request = z.infer<typeof shares_put_request>
export const shares_put_response = shares_egress_list_response
export type shares_put_response = z.infer<typeof shares_put_response>
export const shares_post_request = SharePost
export type shares_post_request = z.infer<typeof shares_post_request>
export const shares_post_response = shares_egress_list_response
export type shares_post_response = z.infer<typeof shares_post_response>
export const shares_delete_request = z.object({id: z.string().uuid()})
export type shares_delete_request = z.infer<typeof shares_delete_request>
export const shares_delete_response = shares_egress_list_response
export type shares_delete_response = z.infer<typeof shares_delete_response>
export const shares_emailcheck_request = z.object({email: z.string()})
export type shares_emailcheck_request = z.infer<typeof shares_emailcheck_request>
export const shares_emailcheck_response = z.object({email: z.string()})
export type shares_emailcheck_response = z.infer<typeof shares_emailcheck_response>

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
      // keyby: 'share.id'
      keyby: 'id'
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
      event_as: "shares_egress_list_response",
      op: "update",
      clears: "share_post_request",
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
      event_as: "shares_egress_list_response",
      op: "update",
      clears: "shares_put_request"
    }
  },
  shares_delete_request: {
    i: {
      e: "shares_delete_request",
      s: z.object({id: z.string()}),
      snoopable: false
    },
    o: {
      e: "shares_delete_response",
      s: shares_delete_response,
      event_as: "shares_egress_list_response",
      op: "delete",
      clears: "shares_delete_request"
    },
  },
  shares_emailcheck_request: {
    i: {
      e: "shares_emailcheck_request",
      s: shares_emailcheck_request,
      snoopable: false
    },
    o: {
      e: "shares_emailcheck_response",
      s: shares_emailcheck_response,
    }
  }
}
