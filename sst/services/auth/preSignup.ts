import {db} from '../data/db'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL

export const handler = async (event, context, callback) => {
  // Kick off any SQL to warm up the RDS instance, which can scale to 0.
  // Currently not awaiting it, so we don't slow this function down; but if the warm-start doesn't end up working,
  // await it here.
  db.executeStatement({sql: "select 1", parameters: []})

  // Set the user pool autoConfirmUser flag after validating the email domain
  event.response.autoConfirmUser = true
  // event.response.autoVerifyPhone = true
  event.response.autoVerifyEmail = true

  // Return to Amazon Cognito
  return event

  // // Split the email address so we can compare domains
  // var address = event.request.userAttributes.email.split("@")
  //
  // // This example uses a custom attribute "custom:domain"
  // if (event.request.userAttributes.hasOwnProperty("custom:domain")) {
  //     if ( event.request.userAttributes['custom:domain'] === address[1]) {
  //         event.response.autoConfirmUser = true;
  //     }
  // }
}
