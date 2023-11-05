import {Routes} from '@gnothi/schemas'
import {FnContext, Route} from '../types'
import {users, User} from '../../data/schemas/users'
import {payments, Payment} from '../../data/schemas/payments'
import {entries, Entry} from '../../data/schemas/entries'
import {and, eq, sql} from 'drizzle-orm'
import {DB} from '../../data/db'
import Stripe from 'stripe'
import {Config} from 'sst/node/config'
import {db} from "../../data/dbSingleton";
import {GnothiError} from "../errors";
import {z} from 'zod'
import {Logger} from "../../aws/logs";

const r = Routes.routes

function getStripe() {
  // Something's wrong where these Config.SECRETs can't be accessed Outside the handler.
  // See https://discord.com/channels/983865673656705025/1113198935343894578/1113234882961866812
  return new Stripe(Config.STRIPE_SK, {
    apiVersion: "2022-11-15"
  })
}

export const stripe_cancel_request = new Route(r.stripe_cancel_request, async (req, context) => {
  const {user, uid,  db} = context
  const stripe = getStripe()

  if (!context.user.payment_id) {
    throw new Error(`Stripe: user ${uid} has no stripe_id`)
  }
  const response = await stripe.subscriptions.cancel(user.payment_id)
  console.log({stripeDeletionResponse: response})

  // don't delete premium yet, the stripe callback will handle that.
  return []
})

export const stripe_list_request = new Route(r.stripe_list_request, async (req, context) => {
  const {user, uid,  db} = context
  if (!user.payment_id) {
    return []
  }
  const stripe = getStripe()
  const sub = await stripe.subscriptions.retrieve(user.payment_id)
  return [sub]
})

export const stripe_webhook_request = new Route(r.stripe_webhook_request, async (req, context) => {
  const stripe = getStripe()
  const endpointSecret = Config.STRIPE_WHSEC
  const {drizzle} = context.db

  const sig = req.headers['stripe-signature'];
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    throw new GnothiError({code: 400, message: `Webhook Error: ${err.message}`})
  }

  console.log(event)

  let user: User
  // See ./README.md for comments on which events we should be listening for
  if (event.type === "checkout.session.completed") {
    const user_id = event.data.object.client_reference_id
    const stripe_id = event.data.object.subscription
    if (!stripe_id) { throw new Error(`Stripe: missing id attr to create subscription. Tried event.data.object.subscription. ${JSON.stringify(event)}`) }
    if (!user_id && stripe_id) { throw new Error(`Stripe: error on completion ${JSON.stringify(event)}`) }
    user = await addSubscription(user_id, stripe_id, context)
  } else if (event.type === "customer.subscription.completed") {
    // This is really where their subscription is activated, but we don't have client_reference_id here,
    // so doing it in the above step
  } else if (event.type === "customer.subscription.deleted") {
    // const stripe_id = event.data.object.id
    // if (!stripe_id) { throw new Error(`Stripe: missing id attr to create subscription. Tried event.data.object.subscription. ${JSON.stringify(event)}`) }
    // user = await cancelSubscription(stripe_id, context)
  } else {
    console.log("Stripe: Unhandled event type", event.type)
  }

  if (user) {
    // update the user of new subscription
    await notifyUser(event, user, context)
    Logger.metric({event: event.type, user})
  }

  // Send acknowledgement receipt to stripe
  return [{message: 'Success'}]
})

async function addSubscription(user_id: string, stripe_id: string, context: FnContext): Promise<User> {
  const drizzle = context.db.drizzle
  const rows = await Promise.all([
    drizzle.update(users)
      .set({premium: true, payment_id: stripe_id})
      .where(eq(users.id, user_id))
      .returning(),
    drizzle.insert(payments).values({user_id, payment_id: stripe_id}).returning()
  ])
  return rows[0][0]
}

async function cancelSubscription(stripe_id: string, context: FnContext): Promise<User> {
  const drizzle = context.db.drizzle
  const rows = await drizzle.update(users)
    .set({premium: false, payment_id: null})
    .where(eq(users.payment_id, stripe_id))
    .returning()
  return rows[0]
}


async function notifyUser(event: object, user: User, context: FnContext) {
  // At this point the user was Stripe, not our user here. Set the context from fake to real
  const c = await context.clone({user, vid: null})
  const {drizzle} = c.db
  if (user.premium) {
    // Send the "Yay!" stuff to did-subscribe. We'll just send premium=false to did-unsubscribe
    await Promise.all([
      // Mark entries for re-evaluation via OpenAI (MUCH higher quality output)
      drizzle.update(entries).set({ai_summarize_state: "todo"})
        .where(eq(entries.user_id, user.id)),

      // And notify the user that this upgrade is happening (could take a while)
      // Note we're creating a one-off route definition just for this, since it's output-only
      c.handleRes(r.stripe_webhook_success.o, {
        data: [event.data.object]
      }, c)
    ])
  }
  await c.handleReq({event: 'users_everything_request', data: {}}, c)
}
