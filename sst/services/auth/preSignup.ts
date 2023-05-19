import {db} from '../data/dbSingleton'
import * as S from "@gnothi/schemas"
const testing = process.env.IS_LOCAL

export const handler = async (event, context, callback) => {

  // When importing v0 database, can skip here; but nothing happens in this function, so
  // I'm excluding it.
  // if (event.request.userAttributes['custom:adminCreated'] === 'true') {
  //   return
  // }


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
