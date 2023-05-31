import {APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2} from "aws-lambda";
import Stripe from 'stripe'
import {db} from '../../data/dbSingleton'
import {Config} from 'sst/node/config'
import {users} from '../../data/schemas/users'
import {eq} from "drizzle-orm";


export const main: APIGatewayProxyHandlerV2 = async (request, context: any) => {
  // Something's wrong where these Config.SECRETs can't be accessed Outside the handler.
  // See https://discord.com/channels/983865673656705025/1113198935343894578/1113234882961866812
  const stripe = new Stripe(Config.STRIPE_SK, {
    apiVersion: "2022-11-15"
  })
  const endpointSecret = Config.STRIPE_WHSEC

  const sig = request.headers['stripe-signature'];
  let event
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret)
  } catch (err) {
    return {statusCode: 400, body: JSON.stringify({message: `Webhook Error: ${err.message}`})}
  }

  console.log(event)

  // See ./README.md for comments on which events we should be listening for
  if (event.type === "checkout.session.completed") {
    const user_id = event.data.object.client_reference_id
    const stripe_id = event.data.object.subscription
    if (!stripe_id) { throw new Error(`Stripe: missing id attr to create subscription. Tried event.data.object.subscription. ${JSON.stringify(event)}`) }
    if (!user_id && stripe_id) { throw new Error(`Stripe: error on completion ${JSON.stringify(event)}`) }
    await db.drizzle.update(users)
      .set({stripe_id, premium: true})
      .where(eq(users.id, user_id))
  } else if (event.type === "customer.subscription.completed") {
    // This is really where their subscription is activated, but we don't have client_reference_id here,
    // so doing it in the above step
  } else if (event.type === "customer.subscription.deleted") {
    const stripe_id = event.data.object.id
    if (!stripe_id) { throw new Error(`Stripe: missing id attr to create subscription. Tried event.data.object.subscription. ${JSON.stringify(event)}`) }    await db.drizzle.update(users)
      .set({premium: false}) // don't delete stripe_id from user, might need for cancellation issues
      .where(eq(users.stripe_id, stripe_id))
  } else {
    console.log("Stripe: Unhandled event type", event.type)
  }

  // Return a 200 response to acknowledge receipt of the event
  return {statusCode: 200, body: JSON.stringify({message: 'Success'})}
}
