import z from 'zod'
import {def, Passthrough} from './utils'
import {v4 as uuid} from "uuid";
export * as Users from './users'

export const Profile = z.object({
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: z.string().optional(),
  orientation: z.string().optional(),
  birthday: z.date().optional(),
  timezone: z.string().optional(),
  bio: z.string().optional()
})
export type Profile = z.infer<typeof Profile>

export const User = Profile.extend({
  // Core
  id: z.string().uuid(),
  email: z.string().email(),
  cognito_id: z.string().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),

  // Administrative
  is_superuser: z.boolean().default(false),
  is_cool: z.boolean().default(false),
  therapist: z.boolean().default(false),
  n_tokens: z.number().default(0),
  affiliate: z.string().optional(), // FK codes.code

  // ML
  ai_ran: z.boolean().default(false),
  last_books: z.date().optional(),
  last_influencers: z.date().optional(),

  // Habitica
  habitica_user_id: z.string().optional(),
  habitica_api_token: z.string().optional(),

  // Relationships (FKs) TODO
})
export type User = z.infer<typeof User>

export const routes = {
  users_everything_request: def({
    eventIn: 'users_everything_request',
    eventOut: 'void',
    schemaIn: z.object({}).passthrough(),
    schemaOut: z.void(),
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  }),
  users_get_request: def({
    eventIn: 'users_get_request',
    eventOut: 'users_get_response',
    schemaIn: z.object({}).passthrough(),
    schemaOut: User, // User,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  }),
  users_get_response: def({
    eventIn: 'users_get_response',
    eventOut: 'void',
    schemaIn: Passthrough,
    schemaOut: User,
    triggerIn: {ws: true},
    triggerOut: {ws: true}
  })
}

export const fakeData = {
  self: User.parse({
    id: uuid(),
    email: 'self@x.com',
    username: 'self',
  }),

  friend: User.parse({
    id: uuid(),
    email: 'friend@x.com',
    username: 'friend'
  }),

  stranger: User.parse({
    id: uuid(),
    email: 'stranger@x.com',
    username: 'stranger'
  })
}
