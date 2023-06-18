import {z} from 'zod'
import {Passthrough, dateCol} from './utils'
import {Users} from './users'
export * as Stripe from './stripe'


export const routes = {
  // this is made an exception for as a Handler type
  stripe_webhook_request: {
    i: {
      e: "stripe_webhook_request",
      s: Passthrough,
      t: {stripe: true},
    },
    o: {
      e: 'void',
      s: Passthrough,
      t: {stripe: true},
    }
  },

  stripe_webhook_success: {
    // no input triggers on this; it's sent manually inside the webhook handler.
    // Just make sure not to create a route off in routes/*
    i: {},
    o: {
      e: "stripe_webhook_success",
      s: Passthrough,
      t: {ws: true},
      keyby: "id"
    }
  },

  // The cancel request submits cancellation to stripe API, and the webhook above actually updates the user, so
  // don't return anything
  stripe_cancel_request: {
    i: {
      e: "stripe_cancel_request",
      s: Passthrough,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'void',
      s: z.void(),
    }
  },
  stripe_list_request: {
    i: {
      e: "stripe_list_request",
      s: Passthrough,
      t: {ws: true},
      snoopable: false
    },
    o: {
      e: 'stripe_list_response',
      s: Passthrough,
      t: {ws: true},
    }
  }
}


