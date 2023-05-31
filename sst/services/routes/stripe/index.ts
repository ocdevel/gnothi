import {Routes} from '@gnothi/schemas'
import {FnContext, Route} from '../types'
import {users} from '../../data/schemas/users'
import {and, eq} from 'drizzle-orm'
import {DB} from '../../data/db'
import Stripe from 'stripe'
import {Config} from 'sst/node/config'

const r = Routes.routes

export const stripe_cancel_request = new Route(r.stripe_cancel_request, async (req, context) => {
  const {user, uid,  db} = context
  const stripe = new Stripe(Config.STRIPE_SK, {
    apiVersion: "2022-11-15"
  })

  if (!context.user.stripe_id) {
    throw new Error(`Stripe: user ${uid} has no stripe_id`)
  }
  const response = await stripe.subscriptions.del(user.stripe_id)
  console.log({stripeDeletionResponse: response})

  // don't delete premium yet, the stripe callback will handle that.
  return []
})

export const stripe_list_request = new Route(r.stripe_list_request, async (req, context) => {
  const {user, uid,  db} = context
  if (!user.stripe_id) {
    return []
  }
  const stripe = new Stripe(Config.STRIPE_SK, {
    apiVersion: "2022-11-15"
  })
  const sub = await stripe.subscriptions.retrieve(user.stripe_id)
  return [sub]
})
