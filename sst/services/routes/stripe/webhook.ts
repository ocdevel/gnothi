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

  const user_id = event.data.object.client_reference_id
  console.log(event)

  // See ./README.md for comments on which events we should be listening for
  // IMPORTANT: if I change this, also change the webhook's events in Stripe dashboard!
  const eventTypes = {
    activate: ['customer.subscription.created'],
    deactivate: ['customer.subscription.deleted'],
    other: ['customer.subscription.updated', 'invoice.payment_succeeded']
  }
  const type_ = event.type

   if (!(eventTypes.activate.includes(type_) || eventTypes.deactivate.includes(type_))) {
    return {statusCode: 200, body: JSON.stringify({message: 'Event type not considered'})}
  }

  // // Using both variables here, just to be DOUBLE sure
  // const activate = eventTypes.activate.includes(type_)
  // const deactivate = eventTypes.deactivate.includes(type_)
  // if (activate && deactivate || !(activate || deactivate)) {
  //   throw new Error(`Stripe: conflict determining subscription status ${event.type}`)
  // }
  // const premium = activate && !deactivate
  const premium = eventTypes.activate.includes(type_)

  if (eventTypes.activate.includes(type_)) {
    await db.drizzle.update(users)
      .set({premium})
      .where(eq(users.id, user_id)).returning()
  }

  // Return a 200 response to acknowledge receipt of the event
  return {statusCode: 200, body: JSON.stringify({message: 'Success'})}
}
