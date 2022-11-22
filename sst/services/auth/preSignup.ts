import {db} from '../data/db'
const testing = process.env.IS_LOCAL

export const handler = async (event, context, callback) => {
  // Set the user pool autoConfirmUser flag after validating the email domain
  event.response.autoConfirmUser = true
  // event.response.autoVerifyPhone = true
  event.response.autoVerifyEmail = true

  // create user in database. maybe add its uid to cognito
  const dbUser = (await db.insert("users", {
      email: event.request.userAttributes.email,
      cognito_id: event.userName,
    }))[0]
  event.request.userAttributes['gnothiId'] = dbUser.id

  // All users need one immutable main tag
  const mainTag = await db.insert("tags",
    {user_id: dbUser.id, name: "Main", main: true})

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
