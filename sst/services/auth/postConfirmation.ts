import {db} from '../data/dbSingleton'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL
import {sql} from 'drizzle-orm/sql'
import {users} from '../data/schemas/users'

export const handler = async (event, context, callback) => {
  // create user in database. maybe add its uid to cognito
  const dbUser = await db.drizzle.insert(users).values({
    email: event.request.userAttributes.email,
    cognito_id: event.userName,
  }).returning()
  const uid = dbUser[0].id
  event.request.userAttributes['gnothiId'] = uid

  // All users need one immutable main tag
  const mainTag = await db.query(
    sql`insert into tags (user_id, name, main) values (${uid}, 'Main', true)`
  )

  return event
}
