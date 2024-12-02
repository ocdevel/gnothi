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

export const CREDIT_MINUTES = 5 // minutes

export const User = createInsertSchema(users, {
  created_at: dateCol(),
  updated_at: dateCol(),
  birthday: dateCol().optional(),
  last_books: dateCol().optional(),
  last_influencers: dateCol().optional(),
  last_credit: dateCol().optional(),
  accept_terms_conditions: dateCol().optional(),
  accept_disclaimer: dateCol().optional(),
  accept_privacy_policy: dateCol().optional(),
})
export type User = z.infer<typeof User>

export const UserSanitized = User.pick({
  id: true, email: true, timezone: true
})
export type UserSanitized = z.infer<typeof UserSanitized>

export const users_list_response = User.or(UserSanitized)
export type users_list_response = z.infer<typeof users_list_response>

export const users_whoami_response = z.object({
  uid: z.string(),
  vid: z.string()
})
export type users_whoami_response = z.infer<typeof users_whoami_response>

// We'll often be submitting individual attributes, like timezone by itself. Be sure to remove "undefined"
// on the server so it doesn't wipe other attrs! We'll allow nulls and empty-strings to get through, as a removal
export const users_put_request = User.pick({
  timezone: true,
  filter_days: true,
  daily_all: true,
  todo_all: true,
  custom_all: true
  // TODO add the profile fields
}).partial()
export type users_put_request = z.infer<typeof users_put_request>


export const routes = {
  users_everything_request: {
    i: {
      e: 'users_everything_request',
      s: Passthrough,
      t: {ws: true},
      snoopable: true,
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

  users_whoami_request: {
    i: {
      e: 'users_whoami_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'users_whoami_response',
      s: users_whoami_response,
      t: {ws: true},
    }
  },

  users_list_request: {
    i: {
      e: 'users_list_request',
      s: Passthrough,
      t: {ws: true},
    },
    o: {
      e: 'users_list_response',
      s: users_list_response,
      t: {ws: true},
      keyby: 'id'
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

  users_put_request: {
    i: {
      e: "users_put_request",
      s: users_put_request,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: "users_put_response",
      s: users_list_response,
      t:  {ws: true},
      event_as: "users_list_response",
      keyby: "id"
    }
  },

  users_credit_request: {
    i: {
      e: "users_credit_request",
      s: Passthrough,
      t: {ws: true},
      snoopable: false,
    },
    o: {
      // response is handled by canGenerative
      e: "void",
      s: z.void(),
    }
  }
}
