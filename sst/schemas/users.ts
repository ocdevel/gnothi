import z from 'zod'
import {Passthrough, DateCol} from './utils'
import {Route} from './api'
import {Events} from './events'
import {v4 as uuid} from "uuid";
export * as Users from './users'

export const Profile = z.object({
  // TODO this will be overridden on server, doubling as display_name
  // from previous version
  username: z.string().optional(),

  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: z.string().optional(),
  orientation: z.string().optional(),
  birthday: DateCol,
  timezone: z.string().optional(),
  bio: z.string().optional()
})
export type Profile = z.infer<typeof Profile>

export const User = Profile.extend({
  // Core
  id: z.string().uuid(),
  email: z.string().email(),
  cognito_id: z.string().optional(),
  created_at: DateCol,
  updated_at: DateCol,

  // Administrative
  is_superuser: z.boolean().default(false),
  is_cool: z.boolean().default(false),
  therapist: z.boolean().default(false),
  n_tokens: z.number().default(0),
  affiliate: z.string().optional(), // FK codes.code

  // ML
  ai_ran: z.boolean().default(false),
  last_books: DateCol,
  last_influencers: DateCol,

  // Habitica
  habitica_user_id: z.string().optional(),
  habitica_api_token: z.string().optional(),

  // Relationships (FKs) TODO
})
export type User = z.infer<typeof User>

export const users_list_response = User.pick({
        id: true, email: true, timezone: true,
        habitica_user_id: true, habitica_api_token: true,
        is_cool: true, paid: true, affiliate: true
      })
export type users_list_response = z.infer<typeof users_list_response>

export const routes = {
  users_everything_request: new Route({
    i: {
      e: 'users_everything_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'void',
      s: z.void(),
    }
  }),
  users_list_request: new Route({
    i: {
      e: 'users_list_request',
      s: Passthrough,
    },
    o: {
      e: 'users_list_response',
      s: users_list_response,
    }
  }),
}


