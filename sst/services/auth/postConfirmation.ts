import {db} from '../data/db'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL
import {sql} from 'drizzle-orm/sql'

export const handler = async (event, context, callback) => {
  // create user in database. maybe add its uid to cognito
  const dbUser = await db.queryFirst<S.Users.User>(
    sql`insert into users (email, cognito_id) values (${event.request.userAttributes.email}, ${event.userName}) returning *;`
  )
  event.request.userAttributes['gnothiId'] = dbUser.id

  // All users need one immutable main tag
  const mainTag = await db.query(
    sql`insert into tags (user_id, name, main) values (${dbUser.id}, 'Main', true)`,
  )

  return event
}
