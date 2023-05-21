import {db} from '../data/dbSingleton'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL
import {sql} from 'drizzle-orm'
import {users} from '../data/schemas/users'
import {tags} from '../data/schemas/tags'
import {PostConfirmationTriggerEvent} from "aws-lambda";

export const handler = async (event: PostConfirmationTriggerEvent, context, callback) => {

  // User already exists, and was manually imported into Cognito as part of the v0 -> v1 migration.
  // Skip the extra stuff
  if (event.request.userAttributes['custom:adminCreated'] === 'true') {
    // make sure custom:gnothiId is added on user-import!
    return event
  }

  // create user in database. maybe add its uid to cognito
  const dbUser = await db.drizzle.insert(users).values({
    email: event.request.userAttributes.email,
    cognito_id: event.userName,
    // These were accepted client-side in registration form
    accept_terms_conditions: new Date(),
    accept_privacy_policy: new Date(),
    accept_disclaimer: new Date()
  }).returning()
  const uid = dbUser[0].id
  event.request.userAttributes['custom:gnothiId'] = uid

  // All users need one immutable main tag
  const mainTag = await db.drizzle.insert(tags).values({
    user_id: uid,
    name: "Main",
    main: true
  })

  // TODO send email

  return event
}
