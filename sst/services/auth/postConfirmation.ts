import {db} from '../data/db'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL

export const handler = async (event, context, callback) => {
  // create user in database. maybe add its uid to cognito
  const dbUser = await db.queryFirst<S.Users.User>(
    "insert into users (email, cognito_id) values ($1, $2) returning *;",
  [
      event.request.userAttributes.email,
      event.userName,
    ]
  )
  event.request.userAttributes['gnothiId'] = dbUser.id

  // All users need one immutable main tag
  const mainTag = await db.query(
    "insert into tags (user_id, name, main) values ($1, 'Main', true)",
    [dbUser.id],
  )

  return event
}
