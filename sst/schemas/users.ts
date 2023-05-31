import {z} from 'zod'
import {Passthrough, dateCol} from './utils'
import {Route} from './api'
import {Events} from './events'
import {v4 as uuid} from "uuid";
import {users} from '../services/data/schemas/users'
import {createInsertSchema} from "drizzle-zod";
export * as Users from './users'

// Note: I had separate schemas for the Profile fields from a user, and User=Profile+Everything. Revisit if needed.
// The fields were: `username, first_name, last_name, birthday, gender, orientation, timezone, bio`
// username will be overridden on server, doubling as display_name from previous version

export const User = createInsertSchema(users, {
  created_at: dateCol(),
  updated_at: dateCol(),
  birthday: dateCol().optional(),
  last_books: dateCol().optional(),
  last_influencers: dateCol().optional(),
  accept_terms_conditions: dateCol().optional(),
  accept_disclaimer: dateCol().optional(),
  accept_privacy_policy: dateCol().optional(),

})
export type User = z.infer<typeof User>

export const users_list_response = User.pick({
  id: true, email: true, timezone: true,
  habitica_user_id: true, habitica_api_token: true,
  is_cool: true, paid: true,
  accept_terms_conditions: true, accept_disclaimer: true, accept_privacy_policy: true,
  premium: true
})
export type users_list_response = z.infer<typeof users_list_response>

export const users_timezone_put_request = User.pick({timezone: true})
export type users_timezone_put_request = z.infer<typeof users_timezone_put_request>

export const routes = {
  users_everything_request: {
    i: {
      e: 'users_everything_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'users_everything_response',
      s: users_list_response,
      // removing {ws:true} because it's handled in function body. Bring back when I have "uid vs vid" setup,
      // needed for determining "me"
      t: {background: true},
    }
  },
  users_everything_response: {
    i: {
      e: 'users_everything_response',
      s: users_list_response,
      t: {background: true}
    },
    o: {
      e: 'void',
      s: z.void(),
      t: {}
    }
  },

  users_list_request: {
    i: {
      e: 'users_list_request',
      s: Passthrough,
    },
    o: {
      e: 'users_list_response',
      s: users_list_response,
    }
  },

  // custom handling of acknowledging privacy/terms/disclaimer for users migrated from v0
  users_acknowledge_request:{
    i: {
      e: 'users_acknowledge_request',
      s: Passthrough,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'void',
      s: z.void()
    }
  },

  users_timezone_put_request: {
    i: {
      e: "users_timezone_put_request",
      s: users_timezone_put_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'users_timezone_put_response',
      s: users_list_response,
      t: {ws: true},
      event_as: 'users_list_request'
    }
  }
}


