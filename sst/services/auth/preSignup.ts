import {db} from '../data/db'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL

export const handler = async (event, context, callback) => {
  // Set the user pool autoConfirmUser flag after validating the email domain
  event.response.autoConfirmUser = true
  // event.response.autoVerifyPhone = true
  event.response.autoVerifyEmail = true

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

  // // Split the email address so we can compare domains
  // var address = event.request.userAttributes.email.split("@")
  //
  // // This example uses a custom attribute "custom:domain"
  // if (event.request.userAttributes.hasOwnProperty("custom:domain")) {
  //     if ( event.request.userAttributes['custom:domain'] === address[1]) {
  //         event.response.autoConfirmUser = true;
  //     }
  // }

  // Return to Amazon Cognito
  return event
}
