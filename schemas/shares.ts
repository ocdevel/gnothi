import {z} from 'zod'
import {Route} from './api'
import {Passthrough, dateCol, IdCol, BoolMap} from './utils'
export * as Shares from './shares'
import {shares, sharesTags, sharesUsers} from '../services/data/schemas/shares'
import {createInsertSchema, createSelectSchema} from "drizzle-zod"
import {users} from '../services/data/schemas/users'

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
  users: BoolMap, // just remember that it's email: true, not uid: true
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

// Create a schema for the ingress share response
export const IngressShare = z.object({
  id: z.string().uuid(),
  share_id: z.string().uuid(),
  obj_id: z.string().uuid(),
  state: z.enum(['pending', 'accepted', 'rejected']),
  share: Share,
  user: createSelectSchema(users)  
})

// export const shares_ingress_list_response = ShareUser
export const shares_ingress_list_response = IngressShare
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

export const routes: Route = {
  shares_ingress_list_request: {
    i: {
      e: 'shares_ingress_list_request',
      s: z.object({}),
      t: {ws: true}
    },
    o: {
      e: 'shares_ingress_list_response',
      s: shares_ingress_list_response,
      t: {ws: true}
    }
  },
  shares_egress_list_request: {
    i: {
      e: 'shares_egress_list_request',
      s: z.object({}),
      t: {ws: true}
    },
    o: {
      e: 'shares_egress_list_response',
      s: shares_egress_list_response,
      t: {ws: true}
    }
  },
  shares_post_request: {
    i: {
      e: 'shares_post_request',
      s: shares_post_request,
      t: {ws: true}
    },
    o: {
      e: 'shares_post_response',
      s: shares_post_response,
      t: {ws: true},
      event_as: 'shares_egress_list_response',
      clears: 'shares_post_request',
      op: 'append'
    }
  },
  shares_put_request: {
    i: {
      e: 'shares_put_request',
      s: shares_put_request,
      t: {ws: true}
    },
    o: {
      e: 'shares_put_response',
      s: shares_put_response,
      t: {ws: true},
      event_as: 'shares_egress_list_response',
      clears: 'shares_put_request',
      op: 'update'
    }
  },
  shares_delete_request: {
    i: {
      e: 'shares_delete_request',
      s: shares_delete_request,
      t: {ws: true}
    },
    o: {
      e: 'shares_delete_response',
      s: shares_delete_response,
      t: {ws: true}
    }
  },
  shares_accept_request: {
    i: {
      e: 'shares_accept_request',
      s: z.object({id: z.string().uuid()}),
      t: {ws: true}
    },
    o: {
      e: 'shares_accept_response',
      s: shares_egress_list_response,
      t: {ws: true}
    }
  },
  shares_reject_request: {
    i: {
      e: 'shares_reject_request',
      s: z.object({id: z.string().uuid()}),
      t: {ws: true}
    },
    o: {
      e: 'shares_reject_response',
      s: shares_egress_list_response,
      t: {ws: true}
    }
  },
  shares_emailcheck_request: {
    i: {
      e: 'shares_emailcheck_request',
      s: shares_emailcheck_request,
      t: {ws: true}
    },
    o: {
      e: 'shares_emailcheck_response',
      s: shares_emailcheck_response,
      t: {ws: true}
    }
  }
}
