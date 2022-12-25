import {db} from '../data/db'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL

export const handler = async (event, context, callback) => {
  // create user in database. maybe add its uid to cognito
  const dbUser = (await db.exec({
    sql: "insert into users (email, cognito_id) values (:email, :cognito_id) returning *;",
    values: {
      email: event.request.userAttributes.email,
      cognito_id: event.userName,
    },
    zIn: S.Users.User
  }))[0]
  event.request.userAttributes['gnothiId'] = dbUser.id

  // All users need one immutable main tag
  const mainTag = await db.exec({
    sql: "insert into tags (user_id, name, main) values (:user_id, 'Main', true)",
    values: {user_id: dbUser.id},
    zIn: S.Tags.Tag
  })

  return event
}
